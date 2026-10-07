import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  sidebarAbierto = false;
  esRutaLogin = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.esRutaLogin = event.urlAfterRedirects.includes('/login');
    });
  }

  toggleSidebar() {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  closeSb() {
    this.sidebarAbierto = false;
  }

  cerrarSesion() {
    this.closeSb();
    this.router.navigate(['/login']);
  }
}
