import {MessageDescriptor, i18n} from '@lingui/core';
import {defineMessage, t} from '@lingui/macro';
import {Platform} from 'react-native';
import {calcSettings} from '@/store/calculation';
import {settings} from '@/store/settings';

const timeTranslations = {
  day: defineMessage({
    id: 'date.day',
    message: 'day',
  }),
  hour: defineMessage({
    id: 'date.hour',
    message: 'hour',
  }),
  minute: defineMessage({
    id: 'date.minute',
    message: 'minute',
  }),
  second: defineMessage({
    id: 'date.second',
    message: 'second',
  }),
} as Record<string, MessageDescriptor>;

function addNumberingToLocale(
  SELECTED_LOCALE: string,
  NUMBERING_SYSTEM: string,
) {
  if (!NUMBERING_SYSTEM) return SELECTED_LOCALE;
  if (SELECTED_LOCALE.includes('-u-')) {
    return `${SELECTED_LOCALE}-nu-${NUMBERING_SYSTEM}`;
  } else {
    return `${SELECTED_LOCALE}-u-nu-${NUMBERING_SYSTEM}`;
  }
}

let {
  IS_24_HOUR_FORMAT,
  NUMBERING_SYSTEM,
  SELECTED_LOCALE,
  SELECTED_ARABIC_CALENDAR,
  SELECTED_SECONDARY_CALENDAR,
} = settings.getState();
SELECTED_LOCALE = addNumberingToLocale(SELECTED_LOCALE, NUMBERING_SYSTEM);

export let formatNu = new Intl.NumberFormat(SELECTED_LOCALE).format;

if (!SELECTED_ARABIC_CALENDAR) {
  SELECTED_ARABIC_CALENDAR = SELECTED_LOCALE.startsWith('fa')
    ? 'islamic-civil'
    : 'islamic';
}
SELECTED_SECONDARY_CALENDAR = SELECTED_SECONDARY_CALENDAR || 'gregory';

let HIJRI_DATE_ADJUSTMENT = calcSettings.getState().HIJRI_DATE_ADJUSTMENT;

settings.subscribe(state => {
  IS_24_HOUR_FORMAT = state.IS_24_HOUR_FORMAT;
  NUMBERING_SYSTEM = state.NUMBERING_SYSTEM;
  SELECTED_LOCALE = state.SELECTED_LOCALE; // probably unnecessary but anyway
  SELECTED_LOCALE = addNumberingToLocale(SELECTED_LOCALE, NUMBERING_SYSTEM);
  formatNu = new Intl.NumberFormat(SELECTED_LOCALE).format;
  SELECTED_ARABIC_CALENDAR = state.SELECTED_ARABIC_CALENDAR;
  if (!SELECTED_ARABIC_CALENDAR) {
    SELECTED_ARABIC_CALENDAR = SELECTED_LOCALE.startsWith('fa')
      ? 'islamic-civil'
      : 'islamic';
  }
  SELECTED_SECONDARY_CALENDAR = state.SELECTED_SECONDARY_CALENDAR || 'gregory';
});

calcSettings.subscribe(state => {
  HIJRI_DATE_ADJUSTMENT = state.HIJRI_DATE_ADJUSTMENT;
});

const oneMinuteInMs = 60 * 1000;
const oneHourInMs = oneMinuteInMs * 60;
const oneDayInMs = 24 * oneHourInMs;

export function addDays(date: Date, days: number) {
  if (!days) return new Date(date.getTime());
  let result = new Date(date.getTime());
  result.setDate(date.getDate() + days);
  while (result.toDateString() === date.toDateString()) {
    // this is for tricky daylight savings
    result = new Date(result.valueOf() + (days / Math.abs(days)) * oneHourInMs);
  }
  return result;
}

export function addMonths(date: Date, months: number) {
  if (!months) return new Date(date.getTime());
  let result = new Date(date.getTime());
  result.setDate(date.getDate() + months * 28);
  while (getMonthName(result) === getMonthName(date)) {
    // this is for tricky daylight savings
    result = new Date(
      result.valueOf() + (months / Math.abs(months)) * oneDayInMs,
    );
  }
  return result;
}

export function getDayBeginning(date: Date) {
  const beginningOfDay = new Date(date.valueOf());
  let hours = 0;
  beginningOfDay.setHours(hours, 0, 0, 0);
  while (beginningOfDay.toDateString() !== date.toDateString()) {
    if (date.getDate() > beginningOfDay.getDate()) {
      hours += 1;
    } else {
      hours -= 1;
    }
    beginningOfDay.setHours(hours, 0, 0, 0);
  }

  return beginningOfDay;
}

export function getNextDayBeginning(date: Date) {
  return getDayBeginning(addDays(date, 1));
}

export function getPrevDayBeginning(date: Date) {
  return getDayBeginning(addDays(date, -1));
}

export function getMonthBeginning(date: Date, hijri?: boolean) {
  let beginningOfMonth = new Date(date.valueOf());
  const day = new Intl.DateTimeFormat(
    'en-US-u-ca-' + hijri
      ? SELECTED_ARABIC_CALENDAR
      : SELECTED_SECONDARY_CALENDAR,
    {
      day: 'numeric',
    },
  ).format(date);
  const subtractAmount = parseInt(day, 10) - 1;
  beginningOfMonth.setDate(beginningOfMonth.getDate() - subtractAmount);
  while (getMonthName(beginningOfMonth, hijri) !== getMonthName(date, hijri)) {
    beginningOfMonth = new Date(beginningOfMonth.getTime() + 60 * 60 * 1000);
  }
  return beginningOfMonth;
}

export function getMonthDates(date: Date, hijri?: boolean) {
  // get first day in month:
  let counterDate = new Date(getMonthBeginning(date, hijri));
  const dates = [];
  // iter
  for (
    ;
    getYearAndMonth(counterDate, hijri) === getYearAndMonth(date, hijri);
    counterDate = addDays(counterDate, 1)
  ) {
    dates.push(counterDate);
  }
  return dates;
}

export function getDayName(date: Date, length: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(SELECTED_LOCALE, {
    weekday: length,
  }).format(date);
}

export function getDayNumeric(date: Date, hijri?: boolean) {
  if (hijri) {
    return getHijriDay(date);
  }
  return new Intl.DateTimeFormat(SELECTED_LOCALE, {
    day: 'numeric',
    calendar: SELECTED_SECONDARY_CALENDAR,
  }).format(date);
}

const persianMonthNames: Record<string, Record<string | number, string>> = {
  en: {
    1: 'Farvardin',
    2: 'Ordibehesht',
    3: 'Khordad',
    4: 'Tir',
    5: 'Mordad',
    6: 'Shahrivar',
    7: 'Mehr',
    8: 'Aban',
    9: 'Azar',
    10: 'Dey',
    11: 'Bahman',
    12: 'Esfand',
  },
  fa: {
    1: 'فروردین',
    2: 'اردیبهشت',
    3: 'خرداد',
    4: 'تیر',
    5: 'مرداد',
    6: 'شهریور',
    7: 'مهر',
    8: 'آبان',
    9: 'آذر',
    10: 'دی',
    11: 'بهمن',
    12: 'اسفند',
  },
};

export function getFormattedDate(date: Date) {
  if (
    Platform.OS === 'android' &&
    Platform.Version < 30 &&
    SELECTED_SECONDARY_CALENDAR === 'persian'
  ) {
    // polyfill for older androids not showing persian calendar properly
    const month = new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);

    let dateParts = new Intl.DateTimeFormat(SELECTED_LOCALE, {
      day: '2-digit',
      year: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    })
      .format(date)
      .split(' ');

    let formattedDate;

    if (SELECTED_LOCALE.startsWith('fa')) {
      const monthName = persianMonthNames['fa'][month];
      formattedDate = `${dateParts[1]} ${monthName} ${dateParts[0]}`;
    } else {
      const monthName = persianMonthNames['en'][month];
      formattedDate = `${monthName} ${dateParts[0]}, ${dateParts[1]} AP`;
    }

    return formattedDate;
  } else {
    return new Intl.DateTimeFormat(SELECTED_LOCALE, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);
  }
}

export function getMonthName(date: Date, hijri?: boolean) {
  if (hijri) return getArabicMonthName(date);
  if (
    Platform.OS === 'android' &&
    Platform.Version < 30 &&
    SELECTED_SECONDARY_CALENDAR === 'persian'
  ) {
    // polyfill for older androids not showing persian calendar properly
    const month = new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);

    if (SELECTED_LOCALE.startsWith('fa')) {
      return persianMonthNames['fa'][month];
    } else {
      return persianMonthNames['en'][month];
    }
  } else {
    return new Intl.DateTimeFormat(SELECTED_LOCALE, {
      month: 'long',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);
  }
}

export function getYearAndMonth(date: Date, hijri?: boolean) {
  if (hijri) {
    const adjustedDate = addDays(date, HIJRI_DATE_ADJUSTMENT);

    return new Intl.DateTimeFormat(
      addNumberingToLocale(
        `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
        NUMBERING_SYSTEM,
      ),
      {
        year: 'numeric',
        month: 'long',
      },
    ).format(adjustedDate);
  }

  if (
    Platform.OS === 'android' &&
    Platform.Version < 30 &&
    SELECTED_SECONDARY_CALENDAR === 'persian'
  ) {
    // polyfill for older androids not showing persian calendar properly
    const month = new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);

    let dateParts = new Intl.DateTimeFormat(SELECTED_LOCALE, {
      year: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    })
      .format(date)
      .split(' ');

    let formattedDate;

    if (SELECTED_LOCALE.startsWith('fa')) {
      const monthName = persianMonthNames['fa'][month];
      formattedDate = `${dateParts[1]} ${monthName} ${dateParts[0]}`;
    } else {
      const monthName = persianMonthNames['en'][month];
      formattedDate = `${monthName} ${dateParts[0]}, ${dateParts[1]} AP`;
    }

    return formattedDate;
  } else {
    return new Intl.DateTimeFormat(SELECTED_LOCALE, {
      month: 'long',
      year: 'numeric',
      calendar: SELECTED_SECONDARY_CALENDAR,
    }).format(date);
  }
}

const faDayPeriodRegex = /([قب]).+از.?ظهر/;

export function getTime(date: Date) {
  if (IS_24_HOUR_FORMAT) {
    return new Intl.DateTimeFormat(SELECTED_LOCALE, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(SELECTED_LOCALE, {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      dayPeriod: 'short',
    })
      .format(date)
      .replace(faDayPeriodRegex, '$1.ظ.');
  }
}

export function getArabicMonthName(date: Date) {
  return new Intl.DateTimeFormat(
    addNumberingToLocale(
      `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
      NUMBERING_SYSTEM,
    ),
    {
      month: 'long',
    },
  ).format(date);
}

export function getArabicDate(date: Date) {
  const adjustedDate = addDays(date, HIJRI_DATE_ADJUSTMENT);

  return new Intl.DateTimeFormat(
    addNumberingToLocale(
      `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
      NUMBERING_SYSTEM,
    ),
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    },
  ).format(adjustedDate);
}

export function getHijriYear(date: Date) {
  const adjustedDate = addDays(date, HIJRI_DATE_ADJUSTMENT);

  return new Intl.DateTimeFormat(
    addNumberingToLocale(
      `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
      NUMBERING_SYSTEM,
    ),
    {
      year: 'numeric',
    },
  ).format(adjustedDate);
}

export function getHijriMonth(date: Date) {
  const adjustedDate = addDays(date, HIJRI_DATE_ADJUSTMENT);

  return new Intl.DateTimeFormat(
    addNumberingToLocale(
      `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
      NUMBERING_SYSTEM,
    ),
    {
      month: 'numeric',
    },
  ).format(adjustedDate);
}

export function getHijriDay(date: Date) {
  const adjustedDate = addDays(date, HIJRI_DATE_ADJUSTMENT);

  return new Intl.DateTimeFormat(
    addNumberingToLocale(
      `ar-u-ca-${SELECTED_ARABIC_CALENDAR}`,
      NUMBERING_SYSTEM,
    ),
    {
      day: 'numeric',
    },
  ).format(adjustedDate);
}

export type DateDiff = {
  days: number;
  hours: number;
  minutes: number;
  future: boolean;
};

export function getDateDiff(from: Date | number, to: Date | number): DateDiff {
  const diff = from.valueOf() - to.valueOf();
  const dayDiffMod = diff % oneDayInMs;
  const dayDiff = (diff - dayDiffMod) / oneDayInMs;
  const hourDiffMod = dayDiffMod % oneHourInMs;
  const hourDiff = Math.floor((dayDiffMod - hourDiffMod) / oneHourInMs);
  const minDiffMod = hourDiffMod % 1000;
  const minDiff = Math.floor((hourDiffMod - minDiffMod) / oneMinuteInMs);
  return {
    days: Math.abs(dayDiff),
    hours: Math.abs(hourDiff),
    minutes: Math.abs(minDiff),
    future: diff.valueOf() < 0,
  };
}

export function getFormattedDateDiff(diff: DateDiff) {
  if (!(diff.days || diff.hours || diff.minutes)) return t`Just now`;
  const d = i18n._(timeTranslations['day']).charAt(0);
  const h = i18n._(timeTranslations['hour']).charAt(0);
  const m = i18n._(timeTranslations['minute']).charAt(0);

  const tense = diff.future ? t`later` : t`ago`;

  if (!diff.hours && !diff.days) {
    return `${formatNu(diff.minutes)}${m} ${tense}`;
  } else if (!diff.days) {
    return `${formatNu(diff.hours)}${h} ${formatNu(diff.minutes)}${m} ${tense}`;
  } else {
    return `${formatNu(diff.days)}${d} ${formatNu(diff.hours)}${h} ${tense}`;
  }
}

export type WeekDayName =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WeekDays: Record<WeekDayName, WeekDayIndex> &
  Record<WeekDayIndex, WeekDayName> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};
