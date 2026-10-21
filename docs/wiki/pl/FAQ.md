# ❓ Często Zadawane Pytania (FAQ)

🌐 **Język / Language**: [English](../FAQ.md) | **Polski** | [Deutsch](../de/FAQ.md) | [Español](../es/FAQ.md) | [Français](../fr/FAQ.md) | [Português (Brasil)](../pt-br/FAQ.md)

---

Oto proste i konkretne odpowiedzi na najczęstsze pytania dotyczące oXyFlow.

---

## 1. Gdzie zapisywane są moje dane i przepracowane godziny?

**W 100% na Twoim własnym komputerze.**  
Wszystkie projekty, zadania i zmierzony czas trafiają do lokalnego pliku bazy danych na Twoim dysku:

- **Windows**: `%APPDATA%\com.oxytime.oxyflow\timelog.db`
- **Linux**: `~/.local/share/com.oxytime.oxyflow/timelog.db`
- **macOS**: `~/Library/Application Support/com.oxytime.oxyflow/timelog.db`

Żadne informacje nie są wysyłane na zewnętrzne serwery. Nikt poza Tobą nie ma wglądu w nazwy Twoich klientów czy czas pracy.

---

## 2. Czy program działa bez dostępu do internetu?

**Tak, całkowicie.**  
oXyFlow nie wymaga połączenia z siecią. Możesz bez przeszkód mierzyć czas w podróży, w samolocie, pociągu czy w kawiarni bez Wi-Fi.

---

## 3. Dlaczego Windows wyświetla niebieski komunikat "SmartScreen" podczas instalacji?

System Windows Defender SmartScreen wyświetla ostrzeżenie dla nowo pobranych programów, które nie posiadają bardzo drogiego, komercyjnego certyfikatu korporacyjnego. oXyFlow to darmowy projekt open-source tworzony przez społeczność.

**Jak bezpiecznie uruchomić:**

1. Kliknij napis **"Więcej informacji"** na niebieskim oknie.
2. Kliknij przycisk **"Uruchom mimo to"**.  
System zapamięta Twój wybór i nie będzie pytać ponownie.

---

## 4. Co się stanie, jeśli zapomnę wyłączyć stoper na noc?

oXyFlow posiada wbudowane reguły bezpieczeństwa!

- Program automatycznie wykrywa przekroczenie północy lub przekroczenie ustalonego limitu godzin (np. 10 godzin).
- Stoper zostanie bezpiecznie zatrzymany, dzięki czemu rano nie zobaczysz nierealistycznej 24-godzinnej doby pracy.

---

## 5. Jak przenieść przepracowane godziny do Excela lub wystawić rachunek?

1. Przejdź do zakładki **Raporty**.
2. Wybierz zakres dat (np. *Ten Tydzień* lub *Ten Miesiąc*).
3. Kliknij **"Eksportuj CSV"**, aby otworzyć dane w Microsoft Excel, Arkuszach Google lub LibreOffice.
4. Możesz też kliknąć **"Eksportuj HTML"**, aby otrzymać gotowe, eleganckie zestawienie do druku lub zapisania jako PDF dla klienta.

---

## 6. Jak przenieść dane na nowy komputer?

1. Otwórz **Ustawienia $\to$ Baza danych**.
2. Kliknij **"Utwórz kopię zapasową"** i zapisz plik `.sqlite` np. na pendrive.
3. Na nowym komputerze zainstaluj oXyFlow, wejdź w **Ustawienia $\to$ Baza danych** i kliknij **"Przywróć bazę danych"**. Cała Twoja historia pojawi się natychmiast!

---

## 7. Jak zmienić język lub kolorystykę programu?

- **Język**: Wejdź w **Ustawienia $\to$ Język** i wybierz język z listy.
- **Kolory**: Wejdź w **Ustawienia $\to$ Wygląd** i wybierz jeden z 12 gotowych motywów.
