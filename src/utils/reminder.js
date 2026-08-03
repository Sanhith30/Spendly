// Daily Expense Reminder Utility using Web Notifications API & In-App Fallbacks

const REMINDER_KEY = 'moneytracker_reminder_enabled';
const REMINDER_TIME_KEY = 'moneytracker_reminder_time'; // Default "21:00"

let timerId = null;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    // Promise-based request (Modern Chrome, Firefox, Edge, Safari 16.4+)
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    // Callback-based fallback for older browsers / iOS Safari
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((perm) => resolve(perm));
      } catch (err) {
        resolve('denied');
      }
    });
  }
}

export function isNotificationSupported() {
  return 'Notification' in window;
}

export function getNotificationStatus() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isReminderEnabled() {
  return localStorage.getItem(REMINDER_KEY) === 'true';
}

export function setReminderEnabled(enabled) {
  localStorage.setItem(REMINDER_KEY, enabled ? 'true' : 'false');
  if (enabled) {
    scheduleNextReminder();
  } else {
    clearScheduledReminder();
  }
}

export function getReminderTime() {
  return localStorage.getItem(REMINDER_TIME_KEY) || '21:00';
}

export function setReminderTime(timeStr) {
  localStorage.setItem(REMINDER_TIME_KEY, timeStr);
  if (isReminderEnabled()) {
    scheduleNextReminder();
  }
}

export async function triggerReminderNotification(fallbackToastFn = null) {
  if (!isNotificationSupported()) {
    if (fallbackToastFn) fallbackToastFn('Did you log your expenses today? 🔥', 'warning');
    return false;
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await requestNotificationPermission();
  }

  if (perm !== 'granted') {
    if (fallbackToastFn) {
      fallbackToastFn('Browser notifications blocked. Enable in site settings! 🔔', 'warning');
    }
    return false;
  }

  try {
    const title = '💰 LEDGER — Daily Reminder';
    const options = {
      body: 'Did you log your expenses today? Keep your spending streak alive! 🔥',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-expense-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch (e) {
    console.warn('Native notification failed, attempting fallback:', e);
    if (fallbackToastFn) {
      fallbackToastFn('Did you log your expenses today? 🔥', 'info');
    }
    return false;
  }
}

function getMsUntilTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    // Target time passed today, schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function scheduleNextReminder(fallbackToastFn = null) {
  clearScheduledReminder();

  if (!isReminderEnabled()) return;

  const timeStr = getReminderTime();
  const msUntilTarget = getMsUntilTime(timeStr);

  timerId = setTimeout(() => {
    triggerReminderNotification(fallbackToastFn);
    // Re-schedule for next day
    scheduleNextReminder(fallbackToastFn);
  }, msUntilTarget);
}

export function clearScheduledReminder() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}
