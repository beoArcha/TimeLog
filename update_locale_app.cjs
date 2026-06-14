const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// replace locale state and add resolvedLocale
app = app.replace(
/  const \[locale, setLocale\] = useState<LocaleType>\(\(\) => \{\n    const saved = localStorage\.getItem\('oxytime_locale'\);\n    if \(saved\) return saved as LocaleType;\n    return navigator\.language\.startsWith\('pl'\) \? 'pl' : 'en';\n  \}\);/,
`  const [localePref, setLocalePref] = useState<LocaleType>(() => {
    const saved = localStorage.getItem('oxytime_locale_pref');
    if (saved) return saved as LocaleType;
    return 'system';
  });

  const [locale, setLocale] = useState<LocaleType>('en');

  useEffect(() => {
    localStorage.setItem('oxytime_locale_pref', localePref);
    if (localePref === 'system') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pl')) setLocale('pl');
      else if (browserLang.startsWith('de')) setLocale('de');
      else if (browserLang.startsWith('es')) setLocale('es');
      else if (browserLang.startsWith('pt')) setLocale('pt-br');
      else if (browserLang.startsWith('fr')) setLocale('fr');
      else setLocale('en');
    } else {
      setLocale(localePref);
    }
  }, [localePref]);`
);

// update useOxyFlow in hooks to add localePref? We don't need to put it in oxyflow yet or maybe?
// Actually if I use `localePref` inside `App.tsx`, I need to pass `setLocalePref` down to the Language Switcher!
app = app.replace(
/locale === lang/g,
"localePref === lang"
);

app = app.replace(
/setLocale\(lang\)/g,
"setLocalePref(lang)"
);

app = app.replace(
/\{\(\['pl', 'en', 'de', 'es', 'pt-br', 'fr'\] as LocaleType\[\]\)/g,
"{(['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as LocaleType[])"
);

fs.writeFileSync('src/App.tsx', app);
