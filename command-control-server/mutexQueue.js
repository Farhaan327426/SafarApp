const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MutexWriteQueue {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.maxBackups = options.maxBackups || 10;
    this.snapshotInterval = options.snapshotInterval || 10;
    this.queue = Promise.resolve();
    this.writeCount = 0;
  }

  enqueueWrite(dataSupplier) {
    this.queue = this.queue.then(async () => {
      await this._performAtomicWrite(dataSupplier());
    }).catch(err => {
      console.error('[MutexQueue] Write error:', err);
    });
    return this.queue;
  }

  async _performAtomicWrite(data) {
    const dataDir = path.dirname(this.filePath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    const jsonContent = JSON.stringify(data, null, 2);
    const checksum = crypto.createHash('sha256').update(jsonContent).digest('hex');
    const container = JSON.stringify({ checksum, data }, null, 2);

    await fs.promises.writeFile(tempPath, container, 'utf8');
    await fs.promises.rename(tempPath, this.filePath);
    this.writeCount++;

    if (this.writeCount % this.snapshotInterval === 0) {
      await this.createBackupSnapshot();
    }
  }

  async createBackupSnapshot() {
    try {
      if (!fs.existsSync(this.filePath)) return;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bakPath = `${this.filePath}.${timestamp}.bak`;
      await fs.promises.copyFile(this.filePath, bakPath);
      await this._rotateSnapshots();
    } catch (e) {
      console.error('[MutexQueue] Backup snapshot error:', e);
    }
  }

  async _rotateSnapshots() {
    try {
      const dir = path.dirname(this.filePath);
      const baseName = path.basename(this.filePath);
      const files = await fs.promises.readdir(dir);
      const bakFiles = files
        .filter(f => f.startsWith(baseName) && f.endsWith('.bak'))
        .sort();

      while (bakFiles.length > this.maxBackups) {
        const oldest = bakFiles.shift();
        if (oldest) await fs.promises.unlink(path.join(dir, oldest));
      }
    } catch (e) {
      console.error('[MutexQueue] Snapshot rotation error:', e);
    }
  }

  static verifyAndUnwrapData(rawContent) {
    const parsed = JSON.parse(rawContent);
    if (parsed && parsed.checksum && parsed.data) {
      const jsonContent = JSON.stringify(parsed.data, null, 2);
      const expectedChecksum = crypto.createHash('sha256').update(jsonContent).digest('hex');
      if (parsed.checksum === expectedChecksum) {
        return parsed.data;
      }
      throw new Error('Checksum mismatch in database integrity check');
    }
    // Fallback for legacy raw data without checksum wrapper
    return parsed;
  }

  static recoverFromLatestSnapshot(filePath) {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath);
    if (!fs.existsSync(dir)) return null;

    const files = fs.readdirSync(dir);
    const bakFiles = files
      .filter(f => f.startsWith(baseName) && f.endsWith('.bak'))
      .sort()
      .reverse(); // Newest first

    for (const bakFile of bakFiles) {
      const bakPath = path.join(dir, bakFile);
      try {
        const content = fs.readFileSync(bakPath, 'utf8');
        const data = MutexWriteQueue.verifyAndUnwrapData(content);
        // Restore to main path
        fs.copyFileSync(bakPath, filePath);
        console.log(`[MutexQueue] Successfully restored database from backup snapshot: ${bakFile}`);
        return data;
      } catch (err) {
        console.warn(`[MutexQueue] Backup file ${bakFile} invalid, trying older snapshot:`, err.message);
      }
    }
    return null;
  }
}

module.exports = { MutexWriteQueue };
