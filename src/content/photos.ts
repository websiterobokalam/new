/**
 * PHOTO REGISTER
 * --------------
 * Every real photo on the site, with what it shows and who is in it.
 *
 * Child-safety rule (our child-safety page, and India's DPDP Act): a photo in
 * which a child can be recognised appears ONLY once Robokalam holds written
 * consent from each child's parent or guardian for this use. Until then
 * `consentConfirmed` stays false and the photo never reaches the HTML;
 * galleries simply show the other photos. To publish one, get the written
 * consent, file it, then set consentConfirmed to true with the date and who
 * holds the forms (`consentRecord`).
 *
 * Personal data visible in a photo is removed before it is added (for example,
 * the student details on the Coding Zone screen are blurred).
 */

export type Photo = {
  id: string;
  /** Base path without extension: /images/real/<id> has .webp (1600w) and -800.webp. */
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Who can be recognised in it. */
  people: "none" | "adults" | "children";
  consentConfirmed?: boolean;
  consentRecord?: string;
  tags: ("lab" | "robotics" | "coding" | "space" | "iot" | "events" | "schools" | "warangal" | "hyderabad" | "recognition" | "classes")[];
};

const p = (id: string, w: number, h: number, rest: Omit<Photo, "id" | "src" | "width" | "height">): Photo => ({ id, src: `/images/real/${id}`, width: w, height: h, ...rest });

export const photos: Photo[] = [
  /* ---------- No recognisable people: always shown ---------- */
  p("robotics-zone", 1600, 900, {
    alt: "The Robotics Zone at a 21C Lab: a humanoid robot, a robot dog, drones, ASHAER L2 robotics kits and 3D-printed parts on a table, with computers behind.",
    caption: "Robotics Zone in a 21C Lab: a humanoid, a robot dog, drones and ASHAER kits.", people: "none", tags: ["lab", "robotics", "schools"],
  }),
  p("space-zone", 1600, 900, {
    alt: "The Space Zone at a 21C Lab: a model lunar lander with solar panels, a rocket, a moon lamp and a rover on a white table.",
    caption: "Space Zone: students' lander, rocket and rover models.", people: "none", tags: ["lab", "space", "schools"],
  }),
  p("coding-zone", 1600, 900, {
    alt: "The Coding Zone at a 21C Lab: an interactive display, a printer and a Coding Zone poster with Python, Java and C++.",
    caption: "Coding Zone: from Scratch to Python, Java and C++.", people: "none", tags: ["lab", "coding", "schools"],
  }),
  p("robot-soccer", 1600, 900, {
    alt: "A robot soccer pitch printed with the Robokalam logo, with three small student-built robot cars and a ball at the centre spot.",
    caption: "Robot soccer: students build, wire and drive their own cars.", people: "none", tags: ["robotics", "events", "classes"],
  }),
  p("iot-sensor-project", 1200, 1600, {
    alt: "An IoT project on a breadboard: temperature, humidity, gas, IR and light sensors wired to a blue LCD showing T:32C H:60% NORMAL.",
    caption: "An IoT weather and air-quality station, wired by hand.", people: "none", tags: ["iot", "classes"],
  }),

  /* ---------- Adults: shown ---------- */
  p("science-day-warangal", 2016, 1512, {
    alt: "The Robokalam team and college volunteers on National Science Day in Warangal, around a space-exploration display with a glowing rocket model, a lander, rovers and a moon lamp.",
    caption: "National Science Day space-STEM drive in Warangal.", people: "adults", tags: ["events", "space", "warangal"],
  }),
  p("tgic-innovation-panchayat", 1449, 2576, {
    alt: "A Robokalam founder receiving a memento at the Telangana Innovation Cell's Innovation Panchayat event.",
    caption: "At the Telangana Innovation Cell's Innovation Panchayat.", people: "adults", tags: ["recognition", "events", "hyderabad"],
  }),
  p("t-hub-event", 1024, 1280, {
    alt: "A collage from a Robokalam event at T-Hub, Hyderabad: registration desks, a robotics and 3D-printing showcase, the 21CSchool software stand and a speaker at the podium.",
    caption: "Robokalam at T-Hub, Hyderabad.", people: "adults", tags: ["events", "hyderabad"],
  }),

  /* ---------- Children: shown only with parents' written consent ---------- */
  p("kids-building-1", 1280, 854, {
    alt: "Young students in school uniform sitting on the floor, building a robot car chassis together.",
    caption: "Building a robot car together.", people: "children", consentConfirmed: false, tags: ["classes", "robotics", "schools"],
  }),
  p("kids-building-2", 1280, 854, {
    alt: "Students fixing two yellow motors onto a robot chassis while a classmate holds it steady.",
    caption: "Two motors, one team.", people: "children", consentConfirmed: false, tags: ["classes", "robotics"],
  }),
  p("classroom-ldr", 960, 1280, {
    alt: "A student drawing a light-dependent resistor (LDR) circuit on an interactive classroom display while classmates watch.",
    caption: "A student explains an LDR circuit to the class.", people: "children", consentConfirmed: false, tags: ["classes", "schools"],
  }),
  p("robot-demo-kids", 2576, 1718, {
    alt: "A Robokalam trainer shows a group of young girls a humanoid robot in the Robotics Zone.",
    caption: "Meeting the humanoid in the Robotics Zone.", people: "children", consentConfirmed: false, tags: ["lab", "robotics", "events"],
  }),
  p("kid-robodog", 2576, 1718, {
    alt: "A young girl kneels on a robot arena mat, guiding a robot dog.",
    caption: "Guiding the robot dog across the arena.", people: "children", consentConfirmed: false, tags: ["robotics", "events"],
  }),
  p("assembly-talk", 2576, 1718, {
    alt: "A Robokalam founder speaks to a hall full of school students in uniform, sitting on the floor.",
    caption: "A talk on technology careers for senior students.", people: "children", consentConfirmed: false, tags: ["schools", "events"],
  }),
];

/** Shown only if no child can be recognised, or the parents' written consent is on file. */
export const isPublishable = (ph: Photo) => ph.people !== "children" || ph.consentConfirmed === true;

export function publicPhotos(tag?: Photo["tags"][number]) {
  return photos.filter((ph) => isPublishable(ph) && (!tag || ph.tags.includes(tag)));
}

export function photo(id: string) {
  const ph = photos.find((x) => x.id === id);
  return ph && isPublishable(ph) ? ph : null;
}
