var monthName = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September', 'Oktober','November','Dezember'];
var monthShort = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
var weekdayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
var weekdayShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
var holidays = [ "2019-01-01","2019-01-06","2019-04-19","2019-04-22","2019-05-01","2019-05-30","2019-06-10","2019-06-20","2019-10-03","2019-11-01","2019-12-25","2019-12-26"];
var annualLeave = 30;
var dailyWorkHours = 8.02;


Apex.chart = {
  locales: [{
    "name": "de",
    "options": {
      "months": monthName,
      "shortMonths": monthShort,
      "days": weekdayName,
      "shortDays": weekdayShort,
      "toolbar": {
        "exportToSVG": "SVG speichern",
        "exportToPNG": "PNG speichern",
        "menu": "Menü",
        "selection": "Auswahl",
        "selectionZoom": "Auswahl vergrößern",
        "zoomIn": "Vergrößern",
        "zoomOut": "Verkleinern",
        "pan": "Verschieben",
        "reset": "Zoom zurücksetzen"
      }
    }
  }],
  defaultLocale: "de"
};
