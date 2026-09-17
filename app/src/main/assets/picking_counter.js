(function () {
  'use strict';

  var ALLOWED_URLS = [
    'babylon.mynt.myntra.com/Picking',
    'babylon.myntrainfo.com/Picking'
  ];

  function isAllowedURL() {
    return ALLOWED_URLS.some(function (u) {
      return window.location.href.indexOf(u) !== -1;
    });
  }

  function teardownCounter() {
    var el = document.getElementById('picking-counter-widget');
    if (el) el.remove();
    window.__pickingCounterActive = false;
  }

  if (!isAllowedURL()) { teardownCounter(); return; }
  if (window.__pickingCounterActive && document.getElementById('picking-counter-widget')) return;
  window.__pickingCounterActive = true;

  // ── Find Profile / User Element in Header/Nav ──────────────
  function getProfileElement() {
    return document.querySelector('[class*="profile"]') ||
           document.querySelector('[class*="user"]') ||
           document.querySelector('[class*="avatar"]') ||
           document.querySelector('.navbar-right') ||
           document.querySelector('header [class*="right"]');
  }

  // ── Attach Widget Neatly Left of Profile Icon ──────────────
  function attachWidgetToHeader() {
    var counterDiv = document.getElementById('picking-counter-widget');
    if (!counterDiv) {
      counterDiv = document.createElement('div');
      counterDiv.id = 'picking-counter-widget';
      counterDiv.style.cssText = [
        'background: transparent',
        'border: none',
        'box-shadow: none',
        'color: inherit',
        'font-size: 12px',
        'font-weight: bold',
        'font-family: Arial, sans-serif',
        'text-align: right',
        'line-height: 1.3',
        'margin-right: 12px',
        'display: inline-flex',
        'flex-direction: column',
        'justify-content: center',
        'align-items: flex-end',
        'pointer-events: auto',
        'white-space: nowrap'
      ].join(';');
    }

    var profileEl = getProfileElement();

    if (profileEl && profileEl.parentNode) {
      // Insert directly to the left of the profile container
      if (counterDiv.nextSibling !== profileEl) {
        profileEl.parentNode.insertBefore(counterDiv, profileEl);
      }
    } else {
      // Fallback: Fixed positioning in top-right clear zone if profile element isn't located
      counterDiv.style.position = 'fixed';
      counterDiv.style.top = '10px';
      counterDiv.style.right = '120px';
      counterDiv.style.zIndex = '99999';
      if (!counterDiv.parentNode) {
        document.body.appendChild(counterDiv);
      }
    }
  }

  // ── Shift Timing Configuration ────────────────────────────
  function getShiftInfo() {
    var now = new Date();
    var hr = now.getHours();

    if (hr >= 8 && hr < 20) {
      return {
        id: 'DAY_8AM_8PM',
        label: 'Shift (8:00 AM - 7:59 PM)'
      };
    } else if (hr >= 20 || hr < 5) {
      return {
        id: 'NIGHT_8PM_5AM',
        label: 'Shift (8:00 PM - 5:00 AM)'
      };
    } else {
      return {
        id: 'OFF_SHIFT',
        label: 'Off Shift (5:00 AM - 8:00 AM)'
      };
    }
  }

  // ── State & Storage ────────────────────────────────────────
  var currentUser     = 'DefaultUser';
  var currentHour     = new Date().getHours();
  var currentDate     = getTodayStr();
  var currentShiftId  = getShiftInfo().id;
  var hourlyCount     = 0;
  var shiftTotalCount = 0;
  var lastSkuCode     = null;
  var debounceTimer   = null;

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function getLoggedInUser() {
    var t = document.body.innerText;
    var e = t.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (e) return e[0];
    var d = t.match(/Desk Code\s+([A-Z0-9-]+)/i);
    if (d) return d[1];

    var header = document.querySelector('header') || document.querySelector('.navbar') || document.body;
    var ht = header.innerText;
    var m = ht.match(/Hi,\s*([a-zA-Z]+)/i) || ht.match(/User:\s*([a-zA-Z0-9]+)/i);
    if (m) return m[1];

    if (window.currentUser && window.currentUser.email) return window.currentUser.email;
    if (window.pickerEmail) return window.pickerEmail;

    return 'DefaultUser';
  }

  function key(type) {
    return 'picking_' + type + '_' + currentUser;
  }

  function saveData() {
    localStorage.setItem(key('date'),     currentDate);
    localStorage.setItem(key('hour'),     currentHour);
    localStorage.setItem(key('shift_id'), currentShiftId);
    localStorage.setItem(key('hourly'),   hourlyCount);
    localStorage.setItem(key('shift'),    shiftTotalCount);
    updateDisplay();
  }

  function loadData() {
    currentUser = getLoggedInUser();

    var savedDate   = localStorage.getItem(key('date')) || '';
    var savedHour   = parseInt(localStorage.getItem(key('hour')), 10);
    var savedShift  = localStorage.getItem(key('shift_id')) || '';
    var savedShiftN = parseInt(localStorage.getItem(key('shift')), 10) || 0;
    var savedHrly   = parseInt(localStorage.getItem(key('hourly')), 10) || 0;

    var now         = new Date().getHours();
    var today       = getTodayStr();
    var activeShift = getShiftInfo().id;

    if (savedDate !== today || savedShift !== activeShift) {
      hourlyCount     = 0;
      shiftTotalCount = 0;
      currentHour     = now;
      currentDate     = today;
      currentShiftId  = activeShift;
    } else if (savedHour === now) {
      hourlyCount     = savedHrly;
      shiftTotalCount = savedShiftN;
      currentHour     = now;
      currentDate     = today;
      currentShiftId  = activeShift;
    } else {
      hourlyCount     = 0;
      shiftTotalCount = savedShiftN;
      currentHour     = now;
      currentDate     = today;
      currentShiftId  = activeShift;
    }

    updateDisplay();
  }

  function checkUserAndHour() {
    var now          = new Date().getHours();
    var today        = getTodayStr();
    var activeShift  = getShiftInfo().id;
    var detectedUser = getLoggedInUser();

    if (detectedUser !== currentUser) {
      currentUser = detectedUser;
      loadData();
      return;
    }

    if (activeShift !== currentShiftId) {
      hourlyCount     = 0;
      shiftTotalCount = 0;
      currentHour     = now;
      currentDate     = today;
      currentShiftId  = activeShift;
      saveData();
      return;
    }

    if (today !== currentDate) {
      hourlyCount     = 0;
      shiftTotalCount = 0;
      currentHour     = now;
      currentDate     = today;
      currentShiftId  = activeShift;
      saveData();
      return;
    }

    if (now !== currentHour) {
      hourlyCount     = 0;
      currentHour     = now;
      saveData();
    }
  }

  function updateDisplay() {
    attachWidgetToHeader();
    var counterDiv = document.getElementById('picking-counter-widget');
    if (!counterDiv) return;

    var d    = new Date();
    var ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    var hr   = d.getHours() % 12 || 12;
    var shift = getShiftInfo();

    counterDiv.innerHTML =
      '<div style="font-weight:bold;">Hour (' + hr + ' ' + ampm + '): <span style="font-weight:bold;">' + hourlyCount + '</span></div>' +
      '<div style="font-weight:bold;margin-top:2px;">' + shift.label + ': <span style="font-weight:bold;">' + shiftTotalCount + '</span></div>';
  }

  // ── Target SKU Code ────────────────────────────────────────
  function getSkuCode() {
    var text = document.body.innerText;
    var skuMatch = text.match(/(?:M\s+)?SKU\s+Code\s*[:\s]*([A-Z0-9]{5,})/i);

    if (skuMatch && skuMatch[1]) {
      return skuMatch[1].trim().toUpperCase();
    }
    return null;
  }

  // ── Scan Verification Logic ────────────────────────────
  function checkScan() {
    var currentSku = getSkuCode();

    if (!currentSku) return;

    if (lastSkuCode === null) {
      lastSkuCode = currentSku;
      return;
    }

    if (currentSku !== lastSkuCode) {
      hourlyCount++;

      var shift = getShiftInfo();
      if (shift.id !== 'OFF_SHIFT') {
        shiftTotalCount++;
      }

      lastSkuCode = currentSku;
      saveData();
    }
  }

  // ── Lifecycle & Observers ──────────────────────────────────
  setInterval(checkUserAndHour, 2000);
  setTimeout(loadData, 1000);

  var observer = new MutationObserver(function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      checkScan();
      attachWidgetToHeader();
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

})();