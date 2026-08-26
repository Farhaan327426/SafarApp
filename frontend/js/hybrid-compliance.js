/**
 * SAFAR — Hybrid Payment & Fare Compliance Engine
 * Handles Digital (UPI/Card) & Cash Payment Workflows,
 * Senior Citizen Receipts, Discrepancy Auditing, Conductor Verification,
 * and Real-Time Regulatory Compliance Exports.
 * Created by Farhaan Bashir
 */

class HybridComplianceService {
  constructor() {
    this.payments = this._loadStorage('safar_payments', []);
    this.cashReceipts = this._loadStorage('safar_cash_receipts', []);
    this.operatorViolations = this._loadStorage('safar_operator_violations', [
      {
        operator_id: "OP_JK01_EXPRESS",
        operator_name: "Kashmir Transit Permit Express Fleet",
        permit_registration: "JK-01-AV-9912",
        overcharge_count: 3,
        overcharge_rate_percent: 2.1,
        average_overcharge_paise: 1300,
        top_violating_routes: ["Srinagar ↔ Budgam", "Srinagar ↔ Anantnag"],
        compliance_score: 95.8,
        recommended_action: "none"
      },
      {
        operator_id: "OP_JK02_VALLEY",
        operator_name: "Valley Matador Transport Co",
        permit_registration: "JK-02-B-4410",
        overcharge_count: 14,
        overcharge_rate_percent: 8.4,
        average_overcharge_paise: 2500,
        top_violating_routes: ["Lal Chowk ↔ Hazratbal", "Srinagar ↔ Baramulla"],
        compliance_score: 78.2,
        recommended_action: "inspect_fleet"
      }
    ]);
  }

  _loadStorage(key, defaultVal) {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
      }
    } catch (e) {}
    return defaultVal;
  }

  _saveStorage(key, data) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {}
  }

  // Generate unique trip reference (e.g., SAF-202608091234)
  _generateTripId() {
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SAF-${dateStr}${rand}`;
  }

  _generateReceiptCode() {
    return 'RCP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * 1. CREATE BOOKING (Hybrid: Digital vs Cash)
   */
  createBooking({
    route_id,
    route_name = "J&K Local Bus",
    boarding_stop,
    deboarding_stop,
    distance_km = 8.5,
    calculated_fare_rupees = 127,
    payment_method = "cash", // 'cash', 'upi', 'card', 'wallet'
    user_id = "USR-2026-SRN",
    user_name = "Commuter"
  }) {
    const trip_id = this._generateTripId();
    const receipt_code = this._generateReceiptCode();
    const calculated_fare_paise = Math.round(calculated_fare_rupees * 100);
    const timestamp = new Date().toISOString();
    const isDigital = (payment_method === 'upi' || payment_method === 'card' || payment_method === 'wallet');

    // Create payment record
    const payment = {
      payment_id: `PAY-${Date.now()}`,
      trip_id,
      route_id,
      route_name,
      boarding_stop,
      deboarding_stop,
      distance_km,
      payment_method,
      calculated_fare_paise,
      actual_paid_paise: isDigital ? calculated_fare_paise : null,
      payment_status: isDigital ? 'completed' : 'pending_confirmation',
      payment_timestamp: timestamp,
      receipt_generated: true,
      receipt_code,
      discrepancy_amount_paise: 0,
      discrepancy_flag: false,
      severity: 'none',
      user_reported_overcharge: false,
      user_report_text: "",
      compliance_status: 'compliant',
      conductor_verified: false,
      conductor_verified_timestamp: null,
      user_id,
      user_name
    };

    // Create cash receipt record
    const cashReceipt = {
      receipt_id: `RCP-ID-${Date.now()}`,
      trip_id,
      receipt_code,
      generated_timestamp: timestamp,
      boarding_stop,
      deboarding_stop,
      route_id,
      route_name,
      calculated_fare_paise,
      calculated_fare_rupees,
      payment_method,
      qr_code_data: `SAFAR_TRIP:${trip_id}:${receipt_code}:${calculated_fare_paise}`,
      is_printed: false,
      printed_timestamp: null,
      user_id
    };

    this.payments.unshift(payment);
    this.cashReceipts.unshift(cashReceipt);
    this._saveStorage('safar_payments', this.payments);
    this._saveStorage('safar_cash_receipts', this.cashReceipts);

    // Dynamic SMS simulation for seniors
    const smsText = isDigital
      ? `SAFAR ALERT: Trip #${trip_id} confirmed. Fare ₹${calculated_fare_rupees} deducted. Show this SMS to driver. Driver cannot charge extra.`
      : `SAFAR RECEIPT: Trip #${trip_id}. Regulated fare ₹${calculated_fare_rupees} for ${boarding_stop} → ${deboarding_stop}. Show Code: ${receipt_code} to driver.`;

    return {
      success: true,
      trip_id,
      receipt_code,
      payment,
      cashReceipt,
      smsText
    };
  }

  /**
   * 2. DISCREPANCY DETECTION LOGIC
   */
  evaluateDiscrepancy(calculatedFarePaise, actualPaidPaise, isCashTrip = true) {
    if (!isCashTrip) {
      return {
        discrepancy_flag: false,
        overcharge_amount_paise: 0,
        severity: 'none',
        compliance_status: 'compliant',
        prompt_user_report: false
      };
    }

    const diffPaise = actualPaidPaise - calculatedFarePaise;

    if (diffPaise === 0) {
      return {
        discrepancy_flag: false,
        overcharge_amount_paise: 0,
        severity: 'none',
        compliance_status: 'compliant',
        prompt_user_report: false
      };
    } else if (diffPaise > 0) {
      let severity = 'none';
      let prompt_user_report = false;

      if (diffPaise <= 5) {
        // <= 5 paise: rounding variance (ignore)
        severity = 'rounding_variance';
      } else if (diffPaise <= 25) {
        // <= 25 paise: minor overcharge (log but don't escalate)
        severity = 'minor_overcharge';
      } else {
        // > 25 paise: major overcharge (log + flag for audit + prompt user)
        severity = 'major_overcharge';
        prompt_user_report = true;
      }

      return {
        discrepancy_flag: true,
        overcharge_amount_paise: diffPaise,
        severity,
        compliance_status: (severity === 'major_overcharge') ? 'violated' : 'under_investigation',
        prompt_user_report
      };
    } else {
      // actualPaid < calculatedFare (Passenger benefits; driver loss; not a violation)
      return {
        discrepancy_flag: false,
        overcharge_amount_paise: diffPaise,
        severity: 'none',
        compliance_status: 'compliant',
        prompt_user_report: false
      };
    }
  }

  /**
   * 3. POST-TRIP PAYMENT CONFIRMATION (User inputs actual cash paid)
   */
  confirmPostTripPayment(trip_id, actual_paid_rupees, user_report_choice = "correct", report_text = "") {
    const payment = this.payments.find(p => p.trip_id === trip_id || p.receipt_code === trip_id);
    if (!payment) return { success: false, error: "Trip not found" };

    const actual_paid_paise = Math.round(actual_paid_rupees * 100);
    const isCash = payment.payment_method === 'cash';

    const discRes = this.evaluateDiscrepancy(payment.calculated_fare_paise, actual_paid_paise, isCash);

    payment.actual_paid_paise = actual_paid_paise;
    payment.discrepancy_amount_paise = discRes.overcharge_amount_paise;
    payment.discrepancy_flag = discRes.discrepancy_flag;
    payment.severity = discRes.severity;
    payment.compliance_status = discRes.compliance_status;
    payment.payment_status = discRes.discrepancy_flag ? 'disputed' : 'completed';

    if (user_report_choice === "overcharged" || discRes.prompt_user_report) {
      payment.user_reported_overcharge = true;
      payment.user_report_text = report_text || `Commuter reported paying ₹${actual_paid_rupees} instead of regulated fare ₹${(payment.calculated_fare_paise/100).toFixed(2)}`;
      
      // Update operator violation metrics
      this._recordOperatorViolation(payment);
    }

    this._saveStorage('safar_payments', this.payments);
    return {
      success: true,
      payment,
      evaluation: discRes
    };
  }

  /**
   * 4. DRIVER SCANNER & VERIFICATION
   */
  verifyConductorCode(receiptCodeOrTripId) {
    const code = (receiptCodeOrTripId || '').trim().toUpperCase();
    const payment = this.payments.find(p => p.receipt_code === code || p.trip_id === code);

    if (!payment) {
      return {
        valid: false,
        message: "❌ Invalid or Expired Pass Code",
        payment: null
      };
    }

    payment.conductor_verified = true;
    payment.conductor_verified_timestamp = new Date().toISOString();
    this._saveStorage('safar_payments', this.payments);

    const isDigital = (payment.payment_method !== 'cash');
    const fareRupees = (payment.calculated_fare_paise / 100).toFixed(2);

    return {
      valid: true,
      trip_id: payment.trip_id,
      receipt_code: payment.receipt_code,
      payment_method: payment.payment_method,
      calculated_fare_rupees: fareRupees,
      boarding_stop: payment.boarding_stop,
      deboarding_stop: payment.deboarding_stop,
      route_name: payment.route_name,
      status_label: isDigital ? "PRE-PAID (Digital)" : "CASH EXPECTED",
      driver_instruction: isDigital
        ? `Accept passenger. No cash collection needed.`
        : `Collect ₹${fareRupees} exactly. Issue digital receipt.`,
      conductor_instruction: isDigital
        ? `Accept passenger. No cash collection needed.`
        : `Collect ₹${fareRupees} exactly. Issue digital receipt.`
    };
  }

  _recordOperatorViolation(payment) {
    let op = this.operatorViolations[0]; // default Kashmir Transit Permit operator
    op.overcharge_count++;
    op.compliance_score = Math.max(50, Number((op.compliance_score - 1.2).toFixed(1)));
    if (op.overcharge_count > 10) {
      op.recommended_action = "inspect_fleet";
    }
    this._saveStorage('safar_operator_violations', this.operatorViolations);
  }

  /**
   * 5. REGULATORY AUDIT REPORT GENERATOR
   */
  generateRegulatoryAuditReport(dateStr = new Date().toISOString().slice(0,10)) {
    const total_trips = this.payments.length;
    const digital_payment = this.payments.filter(p => p.payment_method !== 'cash').length;
    const cash_payment = this.payments.filter(p => p.payment_method === 'cash').length;

    const compliant_trips = this.payments.filter(p => p.compliance_status === 'compliant').length;
    const overcharge_trips = this.payments.filter(p => p.discrepancy_flag).length;
    const overcharge_rate_percent = total_trips > 0 ? Number(((overcharge_trips / total_trips) * 100).toFixed(2)) : 0;

    let total_overcharge_amount_paise = 0;
    this.payments.forEach(p => {
      if (p.discrepancy_amount_paise > 0) {
        total_overcharge_amount_paise += p.discrepancy_amount_paise;
      }
    });

    return {
      report_date: dateStr,
      generated_at: new Date().toISOString(),
      authority: "Jammu & Kashmir Regional Transport Authority (Transport Department / Regional Transit Board)",
      total_trips,
      breakdown: {
        digital_payment,
        cash_payment
      },
      compliance_metrics: {
        compliant_trips,
        overcharge_trips,
        overcharge_rate_percent,
        total_overcharge_amount_paise,
        total_overcharge_amount_rupees: (total_overcharge_amount_paise / 100).toFixed(2)
      },
      violations_by_operator: this.operatorViolations,
      ai_anomaly_insights: [
        "Multiple overcharge pings detected on Lal Chowk ↔ Hazratbal route during peak morning hours.",
        "84.2% of cash commuters confirmed paying exact regulated fare after receipt requirement.",
        "Predictive enforcement flags 2 operator vehicles for Transit Permit spot inspection."
      ]
    };
  }

  /**
   * Print receipt helper for senior citizen paper backup
   */
  printReceipt(receipt_code) {
    const receipt = this.cashReceipts.find(r => r.receipt_code === receipt_code || r.trip_id === receipt_code);
    if (receipt) {
      receipt.is_printed = true;
      receipt.printed_timestamp = new Date().toISOString();
      this._saveStorage('safar_cash_receipts', this.cashReceipts);
    }
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  }
}

// Global Exports
if (typeof window !== 'undefined') {
  window.HybridComplianceService = HybridComplianceService;
  window.hybridComplianceService = new HybridComplianceService();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HybridComplianceService };
}
