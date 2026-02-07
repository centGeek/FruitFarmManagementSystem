INSTRUKCJA URUCHOMIENIA APLIKACJI MENADŻERSADU

Aplikacja składa się z dwóch niezależnych części: serwera (Backend) 
oraz klienta (Frontend). Aby system działał poprawnie, należy uruchomić 
obie warstwy równolegle.


1. WYMAGANE OPROGRAMOWANIE

Przed rozpoczęciem upewnij się, że masz zainstalowane:

- Docker Desktop (do obsługi konteneryzacji bazy danych) lub inne narzędzie zgodne z Docker CLI.
- JDK 21 (można zainstalować i skonfigurować bezpośrednio przez IntelliJ IDEA).
- Środowisko Node.js (wersja zawierająca menedżer pakietów npm). 
- Apache Maven (opcjonalnie, jeśli nie używasz wbudowanego w IDE).
- Środowisko programistyczne (IDE), np.:
   - IntelliJ IDEA (zalecane dla warstwy serwera)
   - Visual Studio Code (zalecane dla warstwy klienta)


2. INSTRUKCJA URUCHOMIENIA - WARSTWA SERWERA (BACKEND)

- Otwórz terminal i przejdź do katalogu backendu:
   cd ./backend

- Uruchom kontenery bazy danych (wymagany działający w tle Docker Desktop).
   Można to zrobić na dwa sposoby: 
    a) Z terminala: 
       docker-compose -f compose.yaml up -d 
    b) Z poziomu IntelliJ IDEA: 
       Otwórz plik compose.yaml i kliknij ikonę "Run" (podwójna strzałka).

- Zbuduj aplikację i pobierz zależności Maven:
   mvn clean package install

- Konfiguracja w IDE (np. IntelliJ IDEA):
   - Otwórz folder ./backend jako projekt.
   - W ustawieniach projektu (Project Structure) upewnij się, że wybrana wersja SDK to Java 21.
   - Odśwież projekt Maven, aby pobrały się wszystkie biblioteki.

- Uruchomienie aplikacji:
   - Znajdź plik: FruitFarmManagementApplication.java
   - Uruchom go (Run).


3. INSTRUKCJA URUCHOMIENIA - WARSTWA KLIENTA (FRONTEND)

- Otwórz nowy terminal (nie zamykając terminala serwera).

- Przejdź do katalogu frontendu:
   cd ./frontend

- Zainstaluj wymagane biblioteki (zależności z załączonego pliku package.json):
   npm install

- Uruchom serwer deweloperski aplikacji:
   npm run dev


4. DOSTĘP DO APLIKACJI

Po poprawnym wykonaniu powyższych kroków aplikacja będzie dostępna 
w przeglądarce internetowej pod adresem: http://localhost:5173/