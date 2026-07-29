// Daily Expense Reminder Utility using Web Notifications API

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
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    return 'denied';
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

export function triggerReminderNotification() {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  try {
    const title = '💰 LEDGER — Daily Reminder';
    const options = {
      body: 'Did you log your expenses today? Keep your spending streak alive! 🔥',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-expense-reminder',
      renotify: true,
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.error('Failed to trigger notification:', e);
  }
}

function getMsUntilTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    // Target time already passed today, schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function scheduleNextReminder() {
  clearScheduledReminder();

  if (!isReminderEnabled() || Notification.permission !== 'granted') return;

  const timeStr = getReminderTime();
  const msUntilTarget = getMsUntilTime(timeStr);

  timerId = setTimeout(() => {
    triggerReminderNotification();
    // Re-schedule for next day
    scheduleNextReminder();
  }, msUntilTarget);
}

export function clearScheduledReminder() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}
