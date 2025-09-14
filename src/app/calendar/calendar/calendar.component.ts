import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniCalendarComponent } from '../mini-calendar/mini-calendar.component';
import { WeekCalendarComponent } from '../week-calendar/week-calendar.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MiniCalendarComponent, WeekCalendarComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  selectedDate: Date = new Date();
  currentYear = new Date().getFullYear();

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }
}
