import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-calendar.component.html',
  styleUrls: ['./mini-calendar.component.scss']
})
export class MiniCalendarComponent {
  @Input() selectedDate: Date = new Date();
  @Output() dateSelected = new EventEmitter<Date>();

  today = new Date();
  currentDate = new Date();
  monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  get monthYear(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  get daysInMonth(): (number|null)[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month+1, 0).getDate();

    const days: (number|null)[] = Array(firstDay).fill(null);
    for (let day = 1; day <= lastDate; day++) {
      days.push(day);
    }
    return days;
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.currentDate = new Date(this.currentDate);
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.currentDate = new Date(this.currentDate);
  }

  selectDay(day: number|null) {
    if (!day) return;
    const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    this.selectedDate = newDate;
    this.dateSelected.emit(newDate);
  }

  isToday(day: number|null) {
    return !!day &&
      day === this.today.getDate() &&
      this.currentDate.getMonth() === this.today.getMonth() &&
      this.currentDate.getFullYear() === this.today.getFullYear();
  }

  isActive(day: number|null) {
    return !!day &&
      day === this.selectedDate.getDate() &&
      this.currentDate.getMonth() === this.selectedDate.getMonth() &&
      this.currentDate.getFullYear() === this.selectedDate.getFullYear();
  }
}
