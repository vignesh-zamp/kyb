import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { HelpChat } from "./HelpChat";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

interface CountrySelectScreenProps {
  onSubmit: (countries: string[]) => void;
  contextData?: any;
  stepInfo?: string;
}

export function CountrySelectScreen({ onSubmit, contextData, stepInfo }: CountrySelectScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (isHelpOpen) {
    return <HelpChat isOpen={true} onToggle={() => setIsHelpOpen(false)} contextData={contextData} stepInfo={stepInfo} />;
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  );

  const addCountry = (country: string) => {
    setSelected(prev => [...prev, country]);
    setSearch("");
  };

  const removeCountry = (country: string) => {
    setSelected(prev => prev.filter(c => c !== country));
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSubmit(selected);
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((country) => (
              <Badge key={country} variant="secondary" className="gap-1 text-sm py-1.5 px-3">
                {country}
                <button onClick={() => removeCountry(country)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="w-full px-4 py-3 border border-border rounded-xl text-base bg-background"
        />
        {search && filteredCountries.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredCountries.slice(0, 5).map((country) => (
              <button
                key={country}
                onClick={() => addCountry(country)}
                className="w-full text-left px-4 py-3 text-base hover:bg-muted rounded-lg"
              >
                {country}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={selected.length === 0} size="lg" className="w-full text-base">
        Continue
      </Button>
      <HelpChat isOpen={false} onToggle={() => setIsHelpOpen(true)} contextData={contextData} stepInfo={stepInfo} />
    </div>
  );
}
