import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = { from: null, to: null },
  onValueChange,
  placeholder = "Selecionar período",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [range, setRange] = useState<DateRange>(value);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Atualizar range quando value mudar
  useEffect(() => {
    setRange(value);
  }, [value]);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const generateCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }

    return days;
  };

  const isDateInRange = (date: Date | null) => {
    if (!date || !range.from) return false;
    
    if (!range.to && hoverDate && range.from) {
      const start = range.from < hoverDate ? range.from : hoverDate;
      const end = range.from < hoverDate ? hoverDate : range.from;
      return date >= start && date <= end;
    }
    
    if (range.to) {
      return date >= range.from && date <= range.to;
    }
    
    return false;
  };

  const isDateSelected = (date: Date | null) => {
    if (!date) return false;
    return (range.from && date.getTime() === range.from.getTime()) ||
           (range.to && date.getTime() === range.to.getTime());
  };

  const handleDateClick = (date: Date) => {
    if (!range.from || (range.from && range.to)) {
      // Primeira seleção ou reset
      const newRange = { from: date, to: null };
      setRange(newRange);
      onValueChange?.(newRange);
    } else if (range.from && !range.to) {
      // Segunda seleção
      const newRange = {
        from: date < range.from ? date : range.from,
        to: date < range.from ? range.from : date,
      };
      setRange(newRange);
      onValueChange?.(newRange);
      setIsOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatRange = () => {
    if (!range.from) return placeholder;
    if (!range.to) return range.from.toLocaleDateString('pt-BR');
    return `${range.from.toLocaleDateString('pt-BR')} - ${range.to.toLocaleDateString('pt-BR')}`;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !range.from && "text-muted-foreground"
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatRange()}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 bg-background border rounded-lg shadow-lg p-3 min-w-[280px]">
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendário */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={cn(
                      "w-full h-full text-sm rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isDateSelected(date) && "bg-primary text-primary-foreground hover:bg-primary/90",
                      isDateInRange(date) && !isDateSelected(date) && "bg-accent/50",
                      date.toDateString() === new Date().toDateString() && "font-bold"
                    )}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* Footer com ações */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRange({ from: null, to: null });
                onValueChange?.({ from: null, to: null });
              }}
            >
              Limpar
            </Button>
            
            {range.from && range.to && (
              <div className="text-xs text-muted-foreground">
                {Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;