/**
 * SAFAR — Early Language Detection (loaded before DOM)
 * Sets document lang and dir based on saved preference.
 */
(function() {
  try {
    var lang = localStorage.getItem('safar_lang') || 'en';
    if (lang !== 'en' && lang !== 'ur' && lang !== 'hi') lang = 'en';
    document.documentElement.lang = lang;
    if (lang === 'ur') {
      document.documentElement.dir = 'rtl';
    }
  } catch (e) {}
})();
