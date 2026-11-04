/**
 * Local pages for the cities Robokalam serves. Facts only: Hyderabad has our head
 * office at T-Hub; Warangal is served online and through school partnerships
 * (old.robokalam.com listed Warangal for ASHAER lab bookings). No school counts
 * or results here unless they come from the Claims Register.
 */

export type CityId = "hyderabad" | "warangal";

export type City = {
  id: CityId;
  name: string;
  te: string;
  region: string;
  /** Neighbourhoods and nearby towns we mention for families and schools. */
  areas: string[];
  geo: { lat: number; lng: number };
  title: string;
  description: string;
  h1: string;
  lede: string;
  office?: { street: string; locality: string; postalCode?: string };
  learners: string;
  schools: string;
  colleges: string;
  faqs: { q: string; a: string }[];
};

export const cities: Record<CityId, City> = {
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    te: "హైదరాబాద్",
    region: "Telangana",
    areas: ["Hitec City", "Gachibowli", "Madhapur", "Kondapur", "Kukatpally", "Banjara Hills", "Jubilee Hills", "Secunderabad", "Manikonda", "Miyapur", "LB Nagar", "Uppal"],
    geo: { lat: 17.4474, lng: 78.3762 },
    title: "Robotics, coding & AI classes and STEM labs in Hyderabad",
    description: "Robokalam in Hyderabad: live robotics, coding and AI classes for kids from age 6, turnkey STEM & AI labs for schools, and Kalamite roles for college students. Head office at T-Hub.",
    h1: "Robotics, coding and AI in Hyderabad.",
    lede: "Robokalam is headquartered at T-Hub, Hitec City. From here we run live classes for children across Hyderabad and Secunderabad, build 21C STEM & AI labs for schools, and train college students to teach as Kalamites.",
    office: { street: "T-Hub Phase 2, Hitec City", locality: "Hyderabad", postalCode: "500081" },
    learners: "Live, small-group classes in robotics, electronics, coding, IoT and AI from age 6, online so no one fights Hyderabad traffic. Kits come home; every class ends with a build. Classes in English, Telugu and Hindi.",
    schools: "For CBSE, ICSE, IB and State Board schools across Hyderabad: the AADHYA AI platform, 21cschool ERP, a turnkey 21C STEM & AI lab, curriculum and teacher training, planned for your campus.",
    colleges: "Engineering, degree and master's students at Hyderabad colleges can become Kalamites: vetted, trained and paid to teach, with every gig's pay shown before you accept.",
    faqs: [
      { q: "Where is Robokalam in Hyderabad?", a: "Our head office is at T-Hub Phase 2, Hitec City, Hyderabad. Learner classes run live online, and school labs are installed on each school's campus." },
      { q: "Do you run robotics classes for kids near me in Hyderabad?", a: "Yes. Classes are live online in small groups, so children anywhere in Hyderabad and Secunderabad can join, with the kit at home. Book a Free Build Session to try one." },
      { q: "Can my child's school in Hyderabad get a robotics or AI lab?", a: "Yes. Schools can book a Turnkey Demo or use the Lab Planner. We suggest a package for your board, classes, student numbers and room." },
      { q: "What languages are classes in?", a: "English, Telugu and Hindi for learners in Telangana and Andhra Pradesh." },
    ],
  },
  warangal: {
    id: "warangal",
    name: "Warangal",
    te: "వరంగల్",
    region: "Telangana",
    areas: ["Hanamkonda", "Kazipet", "Warangal city", "Subedari", "Nakkalagutta", "Jangaon", "Mahabubabad", "Narsampet"],
    geo: { lat: 17.9689, lng: 79.5941 },
    title: "Robotics, coding & AI classes and STEM labs in Warangal",
    description: "Robokalam in Warangal, Hanamkonda and Kazipet: live robotics, coding and AI classes for kids from age 6, STEM & AI labs for schools, and Kalamite roles for college students.",
    h1: "Robotics, coding and AI in Warangal.",
    lede: "Families in Warangal, Hanamkonda and Kazipet join the same live classes as the rest of Telangana, and Warangal schools can set up a 21C STEM & AI lab with curriculum and teacher training from our Hyderabad team.",
    learners: "Live, small-group classes in robotics, electronics, coding, IoT and AI from age 6, online, with the kit at home and a build in every class. Classes in English and Telugu.",
    schools: "For schools across Warangal district: a turnkey 21C STEM & AI lab, ASHAER kits, the AADHYA AI platform, curriculum and teacher training. Planning and training run online; installation is arranged on campus.",
    colleges: "Students at Warangal colleges, including NIT Warangal and Kakatiya University, can apply to become Kalamites and teach online from Warangal.",
    faqs: [
      { q: "Are Robokalam classes available in Warangal?", a: "Yes. Classes are live online in small groups, so children in Warangal, Hanamkonda, Kazipet and nearby towns can join, with the kit at home." },
      { q: "Can a school in Warangal set up a robotics or AI lab?", a: "Yes. Book a Turnkey Demo. Our team plans the lab with you online, trains your teachers and arranges installation on your campus." },
      { q: "Can college students in Warangal teach with Robokalam?", a: "Yes. Students aged 18 and over can apply to become Kalamites. After vetting and paid training, they teach online from wherever they are." },
      { q: "Are classes available in Telugu?", a: "Yes. Learners in Telangana can choose English or Telugu, and Hindi is also available." },
    ],
  },
};

export const cityList = Object.values(cities);
