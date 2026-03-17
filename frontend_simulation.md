# Frontend Integration Guide - Switch from Slug to ID-based Locale Detail

## PHASE C — UPDATE FRONTEND CARD NAVIGATION TO USE locale.id

### Current Issue (What needs to change):
```typescript
// ❌ CURRENT: Cards navigate by slug (causing 404)
<a [routerLink]="['/locales', locale.slug]">
  <img [src]="locale.cover_image_url || '/assets/default-locale.jpg'">
  <h3>{{ locale.display_name }}</h3>
  <p>{{ locale.short_description }}</p>
</a>
```

### Required Fix:
```typescript
// ✅ NEW: Cards navigate by ID (stable)
<a [routerLink]="['/locales/id', locale.id]">
  <img [src]="locale.cover_image_url || '/assets/default-locale.jpg'">
  <h3>{{ locale.display_name }}</h3>
  <p>{{ locale.short_description }}</p>
</a>
```

### Files to Update:
- `src/app/gastronomia/gastronomia.component.html`
- `src/app/tiendas/tiendas.component.html`

### Example Navigation Targets:
- Entre Brasas (id=2) → `/locales/id/2`
- Fornos Pizzeria (id=3) → `/locales/id/3`
- San Carlos Coffee & Cake (id=7) → `/locales/id/7`

---

## PHASE D — UPDATE ANGULAR DETAIL PAGE ROUTE

### Current Route (What needs to change):
```typescript
// ❌ CURRENT: Slug-based route
const routes: Routes = [
  { path: 'locales/:slug', component: LocaleDetailComponent }
];
```

### Required Fix:
```typescript
// ✅ NEW: ID-based route
const routes: Routes = [
  { path: 'locales/id/:id', component: LocaleDetailComponent }
];
```

### Files to Update:
- `src/app/app-routing.module.ts`

---

## PHASE E — UPDATE DETAIL PAGE DATA LOAD FLOW

### Current Service Call (What needs to change):
```typescript
// ❌ CURRENT: Load by slug
getLocaleBySlug(slug: string): Observable<Locale> {
  return this.http.get<Locale>(`${this.apiUrl}/public/locales/${slug}`);
}
```

### Required Fix:
```typescript
// ✅ NEW: Load by ID
getLocaleById(id: number): Observable<Locale> {
  return this.http.get<Locale>(`${this.apiUrl}/public/locales/id/${id}`);
}
```

### Component Update:
```typescript
// ❌ CURRENT: Read slug from route
ngOnInit() {
  this.slug = this.route.snapshot.paramMap.get('slug');
  this.localeService.getLocaleBySlug(this.slug).subscribe(...);
}

// ✅ NEW: Read ID from route
ngOnInit() {
  this.id = +this.route.snapshot.paramMap.get('id'); // Convert to number
  this.localeService.getLocaleById(this.id).subscribe(...);
}
```

### Files to Update:
- `src/app/services/locale.service.ts`
- `src/app/locale-detail/locale-detail.component.ts`

---

## COMPLETE INTEGRATION EXAMPLE

### Updated Gastronomia Cards:
```html
<div class="locales-grid">
  <div class="locale-card" *ngFor="let locale of gastronomiaLocales">
    <a [routerLink]="['/locales/id', locale.id]" class="card-link">
      <div class="card-image">
        <img [src]="locale.cover_image_url || '/assets/default-locale.jpg'" 
             [alt]="locale.display_name">
      </div>
      <div class="card-content">
        <h3>{{ locale.display_name }}</h3>
        <p>{{ locale.short_description }}</p>
        <span class="category-badge">{{ locale.category }}</span>
      </div>
    </a>
  </div>
</div>
```

### Updated Detail Component:
```typescript
export class LocaleDetailComponent implements OnInit {
  locale: Locale;
  id: number;

  constructor(
    private route: ActivatedRoute,
    private localeService: LocaleService
  ) {}

  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id');
    this.loadLocale();
  }

  loadLocale(): void {
    this.localeService.getLocaleById(this.id).subscribe({
      next: (response) => {
        this.locale = response.data;
      },
      error: (error) => {
        console.error('Error loading locale:', error);
      }
    });
  }
}
```

### Updated Service:
```typescript
@Injectable({
  providedIn: 'root'
})
export class LocaleService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Public endpoints
  getPublicLocales(): Observable<LocaleResponse> {
    return this.http.get<LocaleResponse>(`${this.apiUrl}/public/locales`);
  }

  getPublicLocalesByCategory(category: string): Observable<LocaleResponse> {
    return this.http.get<LocaleResponse>(`${this.apiUrl}/public/locales/category/${category}`);
  }

  // ✅ NEW: ID-based detail endpoint
  getLocaleById(id: number): Observable<LocaleResponse> {
    return this.http.get<LocaleResponse>(`${this.apiUrl}/public/locales/id/${id}`);
  }

  // Keep slug endpoint for backward compatibility if needed
  getLocaleBySlug(slug: string): Observable<LocaleResponse> {
    return this.http.get<LocaleResponse>(`${this.apiUrl}/public/locales/${slug}`);
  }
}
```

---

## VERIFICATION TESTS

### Test Case: Entre Brasas (ID 2)
1. Navigate to `/locales/gastronomia`
2. Click "Entre Brasas Parrilla Oriental" card
3. Should navigate to `/locales/id/2` (not `/locales/entrebrasasparrilla`)
4. Should load data from `GET /api/public/locales/id/2`
5. Should display all saved details from `/local-edit`

### Expected Result:
- ✅ No more 404 errors
- ✅ Stable ID-based navigation
- ✅ Content sync between `/local-edit` and public detail page
- ✅ All locale details display correctly
