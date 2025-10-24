# PP Places

Plugin WordPress do zarządzania bazą miejsc z systemem filtrów, paginacji AJAX. Edycja tylko przez wp-admin.

## Description

Plugin **PP Places** to rozwiązanie do wyświetlania i filtrowania bazy miejsc (firm, instytucji) w WordPress. Umożliwia wyświetlanie, filtrowanie i wyszukiwanie wpisów CPT 'places' w tabeli z AJAX-owym ładowaniem.

**Wymagania:** Plugin wymaga zainstalowanego i aktywnego Advanced Custom Fields (ACF) do przechowywania danych.

Główne funkcjonalności:
- Custom Post Type 'places' z polami ACF: nazwa, adres (ulica + numer), NIP, REGON
- Tabela z AJAX-owym ładowaniem danych
- Zaawansowane filtry po wszystkich polach
- Paginacja z przyciskiem "Load More"
- Edycja wpisów **tylko przez panel WordPress Admin**
- Responsywny design i zgodność z WordPress Coding Standards

## Getting Started

### Dependencies

* WordPress 5.0+
* PHP 7.4+
* **Advanced Custom Fields (ACF) - WYMAGANY do działania wtyczki**
* jQuery 3.7+ (wbudowany w WordPress)

### Development Dependencies

* Node.js 14.0+
* Sass 1.77+ (do kompilacji SCSS)

### Build Scripts

```bash
# Zainstaluj zależności
npm install

# Development build (kompiluje SCSS bez source map)
npm run dev

# Production build (kompiluje SCSS i czyści pliki tymczasowe)
npm run build

# Watch mode (kompiluje SCSS przy zmianach)
npm run watch
```

### Installing

1. Pobierz plugin i wgraj do katalogu `wp-content/plugins/pp-places/`
2. Aktywuj plugin w panelu WordPress Admin
3. **Zainstaluj i aktywuj plugin Advanced Custom Fields (ACF) - to jest wymagane**
4. **Skonfiguruj pola ACF dla CPT 'places' (wymagane pola: name, address, nip, regon)**

### Executing program

1. Dodaj shortcode `[places]` do strony lub postu
2. Plugin automatycznie wyświetli tabelę z filtrami i przyciskami
3. Dodawaj nowe wpisy przez WP Admin → Places → Add New
4. Edytuj wpisy przez WP Admin → Places → Edit
5. Użytkownicy mogą filtrować i wyszukiwać wpisy w tabeli

**Shortcode z opcjami:**
```
[places]                    # Domyślnie 2 elementy na stronę
[places per_page="5"]       # 5 elementów na stronę
```

**Funkcjonalności:**
- Tabela ładuje 2 elementy na stronę (można zmienić parametrem `per_page`)
- Przycisk "Load More" pojawia się gdy jest więcej elementów
- Filtrowanie w czasie rzeczywistym
- **Edycja tylko przez panel WordPress Admin**
- Responsywny design

## Help

### Konfiguracja ACF (wymagana)

Plugin wymaga skonfigurowania następujących pól ACF dla CPT 'places':
- `name` (Text) - Nazwa firmy
- `address` (Text) - Pełny adres (ulica + numer)
- `nip` (Text) - NIP
- `regon` (Text) - REGON

**Uwaga:** Wszystkie dane są przechowywane jako pola ACF, nie używamy post_title.

**Uwaga:** Bez pól ACF wtyczka nie będzie działać poprawnie.

**Edycja:** Przejdź do WP Admin → Places → Edit aby edytować wpisy.

### Troubleshooting

**Problem:** Plugin nie działa
**Rozwiązanie:** Upewnij się, że ACF jest zainstalowany i aktywny - to jest wymagane

**Problem:** Pola ACF nie są widoczne
**Rozwiązanie:** Sprawdź czy pola ACF (name, address, nip, regon) są skonfigurowane dla CPT 'places'

**Problem:** AJAX nie ładuje danych
**Rozwiązanie:** Sprawdź czy shortcode jest na stronie, sprawdź konsolę przeglądarki na błędy JavaScript

**Problem:** Brak uprawnień do edycji
**Rozwiązanie:** Użytkownik musi mieć uprawnienia 'edit_post' dla danego wpisu w panelu admin

## Authors

PP Solutions  

## Version History

* 1.0.0
    * Initial Release - implementacja CPT, AJAX, filtrów, Load More, edycja tylko przez wp-admin

## Acknowledgments

Inspiration, code snippets, etc.
* [WordPress Developer Resources](https://developer.wordpress.org/)
* [ACF Documentation](https://www.advancedcustomfields.com/resources/)
* [jQuery](https://jquery.com/)
