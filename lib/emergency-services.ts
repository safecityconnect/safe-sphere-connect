export type EmergencyService = {
  number: string;
  label: string;
  description: string;
  tel: string;
};

export const INDIAN_EMERGENCY_SERVICES: EmergencyService[] = [
  {
    number: "112",
    label: "National Emergency",
    description: "Unified emergency response — police, fire, ambulance",
    tel: "tel:112",
  },
  {
    number: "100",
    label: "Police",
    description: "Report crimes and request police assistance",
    tel: "tel:100",
  },
  {
    number: "101",
    label: "Fire",
    description: "Fire brigade and rescue services",
    tel: "tel:101",
  },
  {
    number: "108",
    label: "Ambulance",
    description: "Medical emergency and ambulance dispatch",
    tel: "tel:108",
  },
  {
    number: "1091",
    label: "Women Helpline",
    description: "24/7 support for women in distress",
    tel: "tel:1091",
  },
  {
    number: "1098",
    label: "Child Helpline",
    description: "Support and protection for children in need",
    tel: "tel:1098",
  },
];

export const PRIMARY_EMERGENCY_NUMBER = INDIAN_EMERGENCY_SERVICES[0];
