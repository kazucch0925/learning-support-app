import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';
import Button from './Button';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // 曜日の配列（日本語）
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 月の日数を取得
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 月の最初の日の曜日を取得（0: 日曜日, 6: 土曜日）
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // カレンダーの日付ボタンを生成
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    // 前月の日を生成
    const prevMonthDays = [];
    const prevMonthDaysCount = firstDayOfMonth;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    for (let i = 0; i < prevMonthDaysCount; i++) {
      const day = daysInPrevMonth - prevMonthDaysCount + i + 1;
      const date = new Date(prevMonthYear, prevMonth, day);
      const isDisabled = 
        (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) || 
        (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

      prevMonthDays.push(
        <button
          key={`prev-${day}`}
          className={`w-9 h-9 text-gray-400 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:hover:bg-transparent`}
          onClick={() => handleDateSelect(date)}
          disabled={isDisabled}
          type="button"
        >
          {day}
        </button>
      );
    }

    // 現在の月の日を生成
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = 
        date.getDate() === new Date().getDate() && 
        date.getMonth() === new Date().getMonth() && 
        date.getFullYear() === new Date().getFullYear();
      const isSelected = 
        date.getDate() === value.getDate() && 
        date.getMonth() === value.getMonth() && 
        date.getFullYear() === value.getFullYear();
      const isDisabled = 
        (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) || 
        (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

      currentMonthDays.push(
        <button
          key={`current-${day}`}
          className={`w-9 h-9 rounded-full
            ${isSelected ? 'bg-teal-600 text-white hover:bg-teal-700' : 'hover:bg-gray-100'} 
            ${isToday && !isSelected ? 'border border-teal-600 text-teal-600' : ''}
            disabled:opacity-50 disabled:hover:bg-transparent
          `}
          onClick={() => handleDateSelect(date)}
          disabled={isDisabled}
          type="button"
        >
          {day}
        </button>
      );
    }

    // 次月の日を生成
    const nextMonthDays = [];
    const totalDays = prevMonthDaysCount + daysInMonth;
    const nextMonthDaysCount = 42 - totalDays; // 6行×7列のカレンダー
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= nextMonthDaysCount; i++) {
      const date = new Date(nextMonthYear, nextMonth, i);
      const isDisabled = 
        (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) || 
        (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()));

      nextMonthDays.push(
        <button
          key={`next-${i}`}
          className={`w-9 h-9 text-gray-400 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:hover:bg-transparent`}
          onClick={() => handleDateSelect(date)}
          disabled={isDisabled}
          type="button"
        >
          {i}
        </button>
      );
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // 前月へ
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 次月へ
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 日付選択
  const handleDateSelect = (date: Date) => {
    if (isValid(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={calendarRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {format(value, 'yyyy年MM月dd日（E）', { locale: ja })}
      </Button>
      
      {isOpen && (
        <div className="absolute mt-1 bg-white border border-gray-200 p-3 rounded-md shadow-lg z-50 w-[280px]">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              &lt;
            </button>
            <div className="font-semibold">
              {format(currentMonth, 'yyyy年MM月', { locale: ja })}
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              &gt;
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day, index) => (
              <div 
                key={day} 
                className={`text-center text-sm font-medium ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-sm text-teal-600 hover:text-teal-800"
              onClick={() => {
                onChange(new Date());
                setIsOpen(false);
              }}
            >
              今日
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker; 