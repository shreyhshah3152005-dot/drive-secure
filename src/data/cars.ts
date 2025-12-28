export interface Dealer {
  name: string;
  city: string;
  phone: string;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number; // Price in INR
  mileage: number;
  fuelType: string;
  transmission: string;
  horsepower: number;
  acceleration: string;
  topSpeed: string;
  image: string;
  description: string;
  features: string[];
  category: string;
  dealers: Dealer[];
}

export const cars: Car[] = [
  // TATA MOTORS
  {
    id: "1",
    name: "Tata Nexon EV",
    brand: "Tata",
    model: "Nexon EV",
    year: 2024,
    price: 1999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 143,
    acceleration: "8.9s (0-100)",
    topSpeed: "140 kmph",
    image: "https://images.hindustantimes.com/auto/img/2023/09/08/1600x900/2023_Tata_Nexon_EV_Facelift_new_1694104161565_1694160092028.jpg",
    description: "India's best-selling electric SUV with 437km range and Ziptron technology.",
    features: ["Connected Car Tech", "Ventilated Seats", "Sunroof", "iRA Connected Features"],
    category: "Electric",
    dealers: [
      { name: "Tata Motors Mumbai Central", city: "Mumbai", phone: "+91 22 2345 6789" },
      { name: "Tata AutoWorld", city: "Delhi", phone: "+91 11 2345 6789" },
      { name: "Concorde Motors", city: "Bangalore", phone: "+91 80 2345 6789" }
    ]
  },
  {
    id: "2",
    name: "Tata Harrier",
    brand: "Tata",
    model: "Harrier",
    year: 2024,
    price: 2499000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 170,
    acceleration: "9.2s (0-100)",
    topSpeed: "190 kmph",
    image: "https://imgd.aeplcdn.com/600x600/n/cw/ec/172075/tata-harrier-left-front-three-quarter3.jpeg?isig=0&wm=0",
    description: "Built on OMEGARC platform derived from Land Rover. Premium Indian SUV.",
    features: ["Panoramic Sunroof", "JBL Sound System", "ADAS Suite", "Terrain Response"],
    category: "SUV",
    dealers: [
      { name: "Tata Motors Andheri", city: "Mumbai", phone: "+91 22 3456 7890" },
      { name: "Tata Shree Motors", city: "Pune", phone: "+91 20 2345 6789" }
    ]
  },
  {
    id: "3",
    name: "Tata Safari",
    brand: "Tata",
    model: "Safari",
    year: 2024,
    price: 2799000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 170,
    acceleration: "9.8s (0-100)",
    topSpeed: "190 kmph",
    image: "https://www.motoarc.com/wp-content/uploads/2023/10/tata-safari-facelift-right-front-three-quarter7.webp",
    description: "The legendary Safari reborn. Three-row luxury SUV with commanding presence.",
    features: ["Captain Seats", "Panoramic Sunroof", "Air Purifier", "11-Speaker JBL"],
    category: "SUV",
    dealers: [
      { name: "Tata Motors Connaught Place", city: "Delhi", phone: "+91 11 3456 7890" },
      { name: "Tata Premier Motors", city: "Chennai", phone: "+91 44 2345 6789" }
    ]
  },
  {
    id: "4",
    name: "Tata Punch EV",
    brand: "Tata",
    model: "Punch EV",
    year: 2024,
    price: 1449000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 120,
    acceleration: "9.5s (0-100)",
    topSpeed: "130 kmph",
    image: "https://www.v3cars.com/media/model-imgs/1705644798-03-punch-ev-front-quater-exterior.webp",
    description: "India's first 5-star safety rated EV. Compact, efficient, and feature-packed.",
    features: ["Arcade.ev Platform", "Voice Assistance", "Connected Car", "Regenerative Braking"],
    category: "Electric",
    dealers: [
      { name: "Tata Motors Koramangala", city: "Bangalore", phone: "+91 80 3456 7890" },
      { name: "Tata AutoMart", city: "Hyderabad", phone: "+91 40 2345 6789" }
    ]
  },
  {
    id: "5",
    name: "Tata Curvv EV",
    brand: "Tata",
    model: "Curvv EV",
    year: 2024,
    price: 1999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 167,
    acceleration: "8.6s (0-100)",
    topSpeed: "160 kmph",
    image: "https://images.drivespark.com/img/2025/04/tata-curvv-ev-dark-edition-cover-jpg-1744707859955_1744707860052-1200x675.jpg",
    description: "India's first electric SUV coupe with stunning design and 500km range.",
    features: ["Coupe Design", "45kWh Battery", "Fast Charging", "Level 2 ADAS"],
    category: "Electric",
    dealers: [
      { name: "Tata Motors Bandra", city: "Mumbai", phone: "+91 22 4567 8901" },
      { name: "Tata Motors Whitefield", city: "Bangalore", phone: "+91 80 4567 8901" }
    ]
  },
  {
    id: "6",
    name: "Tata Tiago EV",
    brand: "Tata",
    model: "Tiago EV",
    year: 2024,
    price: 1199000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 75,
    acceleration: "11.2s (0-100)",
    topSpeed: "120 kmph",
    image: "https://www.tatamotors.com/wp-content/uploads/2022/09/press-28sep22-003.jpg",
    description: "India's most affordable electric car with 315km range.",
    features: ["Ziptron Technology", "Connected Car", "Regenerative Braking", "Multi-mode Regen"],
    category: "Electric",
    dealers: [
      { name: "Tata Motors Thane", city: "Mumbai", phone: "+91 22 5678 9012" },
      { name: "Tata AutoZone", city: "Ahmedabad", phone: "+91 79 2345 6789" }
    ]
  },

  // MAHINDRA
  {
    id: "7",
    name: "Mahindra XUV700",
    brand: "Mahindra",
    model: "XUV700",
    year: 2024,
    price: 2699000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 185,
    acceleration: "8.5s (0-100)",
    topSpeed: "200 kmph",
    image: "https://images.timesdrive.in/photo/msid-151020831,thumbsize-undefined/151020831.jpg",
    description: "Flagship Mahindra SUV with ADAS technology and premium features.",
    features: ["ADAS Level 2", "AdrenoX Connect", "Sony 3D Sound", "Dual Zone Climate"],
    category: "SUV",
    dealers: [
      { name: "Mahindra World City", city: "Mumbai", phone: "+91 22 6789 0123" },
      { name: "Mahindra First Choice", city: "Delhi", phone: "+91 11 6789 0123" },
      { name: "Mahindra AutoHub", city: "Chennai", phone: "+91 44 6789 0123" }
    ]
  },
  {
    id: "8",
    name: "Mahindra Thar Roxx",
    brand: "Mahindra",
    model: "Thar Roxx",
    year: 2024,
    price: 1899000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 175,
    acceleration: "10.5s (0-100)",
    topSpeed: "170 kmph",
    image: "https://i.pinimg.com/736x/61/a0/7b/61a07b60eb9c238a7905e837f1380f40.jpg",
    description: "The iconic Indian off-roader with 5-doors for families who crave adventure.",
    features: ["4x4 Shift-on-Fly", "Washable Interior", "Roll Cage", "Adventure Statistics"],
    category: "Off-Road",
    dealers: [
      { name: "Mahindra Adventure Zone", city: "Gurgaon", phone: "+91 124 2345 6789" },
      { name: "Mahindra Motors Powai", city: "Mumbai", phone: "+91 22 7890 1234" }
    ]
  },
  {
    id: "9",
    name: "Mahindra Scorpio-N",
    brand: "Mahindra",
    model: "Scorpio-N",
    year: 2024,
    price: 2399000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 175,
    acceleration: "9.0s (0-100)",
    topSpeed: "190 kmph",
    image: "https://stimg2.cardekho.com/images/carNewsEditorImages/userimages/20220628_152045/29296/mahindra0.jpg?impolicy=resize&imwidth=420",
    description: "The Big Daddy of SUVs. Rugged, powerful, and loaded with features.",
    features: ["4XPLOR System", "Sony 3D Audio", "Dual Zone AC", "Terrain Modes"],
    category: "SUV",
    dealers: [
      { name: "Mahindra Motors Rajouri", city: "Delhi", phone: "+91 11 7890 1234" },
      { name: "Mahindra Exclusive", city: "Kolkata", phone: "+91 33 2345 6789" }
    ]
  },
  {
    id: "10",
    name: "Mahindra XUV400",
    brand: "Mahindra",
    model: "XUV400",
    year: 2024,
    price: 1899000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 150,
    acceleration: "8.3s (0-100)",
    topSpeed: "150 kmph",
    image: "https://popularmahindra.com/assets/images/vehicle/esuvs/16/slider/slider.jpg",
    description: "Electric evolution of XUV300 with 456km range and fast charging.",
    features: ["AdrenoX Connect", "Sunroof", "IP67 Battery", "Fast Charging"],
    category: "Electric",
    dealers: [
      { name: "Mahindra Electric Hub", city: "Bangalore", phone: "+91 80 8901 2345" },
      { name: "Mahindra EV World", city: "Pune", phone: "+91 20 8901 2345" }
    ]
  },
  {
    id: "11",
    name: "Mahindra XUV3XO",
    brand: "Mahindra",
    model: "XUV3XO",
    year: 2024,
    price: 1599000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 130,
    acceleration: "10.2s (0-100)",
    topSpeed: "180 kmph",
    image: "https://auto.hindustantimes.com/cms-images/mahindra_xuv-3xo/images/exterior_mahindra-xuv-3xo_front-left-side_1063x676.jpg",
    description: "Compact SUV with premium features and sporty design.",
    features: ["Panoramic Sunroof", "ADAS", "Wireless Charging", "7-inch Display"],
    category: "SUV",
    dealers: [
      { name: "Mahindra Mall Road", city: "Delhi", phone: "+91 11 8901 2345" },
      { name: "Mahindra Exclusive Showroom", city: "Chandigarh", phone: "+91 172 2345 678" }
    ]
  },
  {
    id: "12",
    name: "Mahindra BE 6",
    brand: "Mahindra",
    model: "BE 6",
    year: 2025,
    price: 1899000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 286,
    acceleration: "6.7s (0-100)",
    topSpeed: "200 kmph",
    image: "https://www.spinny.com/blog/wp-content/uploads/2025/03/Mahindra-BE-6.jpg",
    description: "Born Electric platform SUV with futuristic design and 682km range.",
    features: ["INGLO Platform", "5-screen Setup", "Vehicle-to-Load", "OTA Updates"],
    category: "Electric",
    dealers: [
      { name: "Mahindra Born Electric", city: "Mumbai", phone: "+91 22 9012 3456" },
      { name: "Mahindra BE Hub", city: "Delhi", phone: "+91 11 9012 3456" }
    ]
  },

  // MARUTI SUZUKI
  {
    id: "13",
    name: "Maruti Suzuki Grand Vitara",
    brand: "Maruti Suzuki",
    model: "Grand Vitara",
    year: 2024,
    price: 2199000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 116,
    acceleration: "10.8s (0-100)",
    topSpeed: "175 kmph",
    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/123185/grand-vitara-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80",
    description: "Premium SUV with strong hybrid technology delivering 27.97 kmpl mileage.",
    features: ["AllGrip AWD", "Head-Up Display", "360° Camera", "Ventilated Seats"],
    category: "SUV",
    dealers: [
      { name: "Maruti Arena Andheri", city: "Mumbai", phone: "+91 22 1234 5678" },
      { name: "Maruti Nexa Connaught Place", city: "Delhi", phone: "+91 11 1234 5678" },
      { name: "Maruti Nexa MG Road", city: "Bangalore", phone: "+91 80 1234 5678" }
    ]
  },
  {
    id: "14",
    name: "Maruti Suzuki Invicto",
    brand: "Maruti Suzuki",
    model: "Invicto",
    year: 2024,
    price: 2899000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 186,
    acceleration: "9.5s (0-100)",
    topSpeed: "180 kmph",
    image: "https://cdni.autocarindia.com/ExtraImages/20230705012252_maruti_suzuki_invicto.jpg",
    description: "Premium MPV with self-charging hybrid technology and luxury features.",
    features: ["Ottoman Seats", "Wireless Charging", "JBL Sound", "Power Tailgate"],
    category: "MPV",
    dealers: [
      { name: "Maruti Nexa Premium", city: "Mumbai", phone: "+91 22 2345 6789" },
      { name: "Maruti Nexa Select", city: "Delhi", phone: "+91 11 2345 6789" }
    ]
  },
  {
    id: "15",
    name: "Maruti Suzuki Jimny",
    brand: "Maruti Suzuki",
    model: "Jimny",
    year: 2024,
    price: 1499000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "4-speed Automatic",
    horsepower: 105,
    acceleration: "12.5s (0-100)",
    topSpeed: "145 kmph",
    image: "https://i.pinimg.com/736x/62/1d/5a/621d5a320800d0be2df54ea4813ff66a.jpg",
    description: "Legendary off-roader with ladder frame and AllGrip Pro 4WD.",
    features: ["AllGrip Pro 4WD", "Ladder Frame", "Hill Descent", "Brake LSD"],
    category: "Off-Road",
    dealers: [
      { name: "Maruti Nexa Off-Road Center", city: "Gurgaon", phone: "+91 124 3456 7890" },
      { name: "Maruti Adventure Hub", city: "Pune", phone: "+91 20 3456 7890" }
    ]
  },
  {
    id: "16",
    name: "Maruti Suzuki Fronx",
    brand: "Maruti Suzuki",
    model: "Fronx",
    year: 2024,
    price: 1399000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 100,
    acceleration: "10.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/130591/fronx-exterior-right-front-three-quarter-108.jpeg?isig=0&q=80",
    description: "Sporty crossover with BoosterJet turbo engine and premium features.",
    features: ["Turbo Engine", "Head-Up Display", "360° Camera", "Wireless CarPlay"],
    category: "Crossover",
    dealers: [
      { name: "Maruti Nexa Powai", city: "Mumbai", phone: "+91 22 3456 7890" },
      { name: "Maruti Nexa Sector 29", city: "Gurgaon", phone: "+91 124 4567 8901" }
    ]
  },
  {
    id: "17",
    name: "Maruti Suzuki Brezza",
    brand: "Maruti Suzuki",
    model: "Brezza",
    year: 2024,
    price: 1499000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 103,
    acceleration: "11.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://images.autox.com/uploads/2022/06/Maruti-Brezza13.jpg",
    description: "India's best-selling compact SUV with modern design and features.",
    features: ["Sunroof", "Suzuki Connect", "360° Camera", "Head-Up Display"],
    category: "SUV",
    dealers: [
      { name: "Maruti Arena Juhu", city: "Mumbai", phone: "+91 22 4567 8901" },
      { name: "Maruti Arena Noida", city: "Delhi NCR", phone: "+91 120 2345 6789" }
    ]
  },
  {
    id: "18",
    name: "Maruti Suzuki eVitara",
    brand: "Maruti Suzuki",
    model: "eVitara",
    year: 2025,
    price: 2499000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 174,
    acceleration: "8.0s (0-100)",
    topSpeed: "160 kmph",
    image: "https://imgd.aeplcdn.com/1600x900/n/cw/ec/185537/maruti-suzuki-evx-left-front-three-quarter0.jpeg?isig=0&q=75",
    description: "First electric SUV from Maruti with 61kWh battery and 500km range.",
    features: ["e-Axle AWD", "V2L Capability", "Fast Charging", "ADAS Suite"],
    category: "Electric",
    dealers: [
      { name: "Maruti Nexa EV World", city: "Mumbai", phone: "+91 22 5678 9012" },
      { name: "Maruti Electric Zone", city: "Bangalore", phone: "+91 80 5678 9012" }
    ]
  },

  // HYUNDAI
  {
    id: "19",
    name: "Hyundai Creta",
    brand: "Hyundai",
    model: "Creta",
    year: 2024,
    price: 2199000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DCT",
    horsepower: 160,
    acceleration: "9.0s (0-100)",
    topSpeed: "185 kmph",
    image: "https://www.hyundai.com/content/dam/hyundai/in/en/data/find-a-car/Creta/Highlights/knightking/cretakingmountain.jpg",
    description: "Best-selling mid-size SUV with bold design and Level 2 ADAS.",
    features: ["Level 2 ADAS", "Panoramic Sunroof", "Bose Sound", "Ventilated Seats"],
    category: "SUV",
    dealers: [
      { name: "Hyundai Plaza Worli", city: "Mumbai", phone: "+91 22 6789 0123" },
      { name: "Hyundai Motors Saket", city: "Delhi", phone: "+91 11 6789 0123" },
      { name: "Hyundai World Indiranagar", city: "Bangalore", phone: "+91 80 6789 0123" }
    ]
  },
  {
    id: "20",
    name: "Hyundai Tucson",
    brand: "Hyundai",
    model: "Tucson",
    year: 2024,
    price: 3499000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "8-speed Automatic",
    horsepower: 186,
    acceleration: "8.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/166917/tucson-facelift-exterior-left-front-three-quarter.jpeg?isig=0&q=80",
    description: "Premium SUV with parametric jewel grille and HTRAC AWD system.",
    features: ["HTRAC AWD", "Bose Premium Audio", "Blind Spot Monitor", "Power Tailgate"],
    category: "SUV",
    dealers: [
      { name: "Hyundai Signature Lounge", city: "Mumbai", phone: "+91 22 7890 1234" },
      { name: "Hyundai Premium Gallery", city: "Delhi", phone: "+91 11 7890 1234" }
    ]
  },
  {
    id: "21",
    name: "Hyundai Ioniq 5",
    brand: "Hyundai",
    model: "Ioniq 5",
    year: 2024,
    price: 4695000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 325,
    acceleration: "5.2s (0-100)",
    topSpeed: "185 kmph",
    image: "https://www.hyundai.com/content/dam/hyundai/ww/en/images/find-a-car/pip/eco/ioniq5-2024/highlights/ioniq5-highlights-kv-m.jpg",
    description: "Award-winning electric crossover with 800V architecture and ultra-fast charging.",
    features: ["800V Fast Charging", "V2L", "Relaxation Seats", "Vision Roof"],
    category: "Electric",
    dealers: [
      { name: "Hyundai EV Hub BKC", city: "Mumbai", phone: "+91 22 8901 2345" },
      { name: "Hyundai Electric Lounge", city: "Delhi", phone: "+91 11 8901 2345" }
    ]
  },
  {
    id: "22",
    name: "Hyundai Verna",
    brand: "Hyundai",
    model: "Verna",
    year: 2024,
    price: 1799000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DCT",
    horsepower: 160,
    acceleration: "8.8s (0-100)",
    topSpeed: "195 kmph",
    image: "https://www.cartoq.com/wp-content/uploads/2023/03/2023-hyundai-verna-1-1.jpg",
    description: "Premium sedan with sporty design and Level 2 ADAS features.",
    features: ["Level 2 ADAS", "Digital Cluster", "Bose Audio", "Ventilated Seats"],
    category: "Sedan",
    dealers: [
      { name: "Hyundai Motors Bandra", city: "Mumbai", phone: "+91 22 9012 3456" },
      { name: "Hyundai World Sector 18", city: "Noida", phone: "+91 120 3456 7890" }
    ]
  },
  {
    id: "23",
    name: "Hyundai Alcazar",
    brand: "Hyundai",
    model: "Alcazar",
    year: 2024,
    price: 2399000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 159,
    acceleration: "9.5s (0-100)",
    topSpeed: "185 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/157825/alcazar-facelift-exterior-left-front-three-quarter-3.jpeg?isig=0&q=80&q=80",
    description: "Premium 7-seater SUV with captain seats and ADAS technology.",
    features: ["ADAS Level 2", "Captain Seats", "Boss Mode", "Dual Sunroof"],
    category: "SUV",
    dealers: [
      { name: "Hyundai Family Hub", city: "Mumbai", phone: "+91 22 0123 4567" },
      { name: "Hyundai Select Dwarka", city: "Delhi", phone: "+91 11 0123 4567" }
    ]
  },
  {
    id: "24",
    name: "Hyundai Venue",
    brand: "Hyundai",
    model: "Venue",
    year: 2024,
    price: 1399000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DCT",
    horsepower: 120,
    acceleration: "10.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://imgd-ct.aeplcdn.com/1056x660/n/cw/ec/197163/venue-exterior-left-front-three-quarter.jpeg?isig=0&q=80",
    description: "Connected compact SUV with BlueLink technology and modern features.",
    features: ["BlueLink Connected", "Sunroof", "Wireless Charging", "Bose Audio"],
    category: "SUV",
    dealers: [
      { name: "Hyundai Express Malad", city: "Mumbai", phone: "+91 22 1234 5670" },
      { name: "Hyundai Quick Lajpat Nagar", city: "Delhi", phone: "+91 11 1234 5670" }
    ]
  },

  // KIA
  {
    id: "25",
    name: "Kia Seltos",
    brand: "Kia",
    model: "Seltos",
    year: 2024,
    price: 2199000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 159,
    acceleration: "9.2s (0-100)",
    topSpeed: "185 kmph",
    image: "https://www.kia.com/content/dam/kia2/in/en/our-vehicles/new-seltos/showroom/main_d.png",
    description: "Bold and sophisticated SUV with X-Line styling and ADAS.",
    features: ["ADAS Level 2", "Bose Audio", "Ventilated Seats", "360° Camera"],
    category: "SUV",
    dealers: [
      { name: "Kia Motors Powai", city: "Mumbai", phone: "+91 22 2345 6780" },
      { name: "Kia World Gurugram", city: "Gurgaon", phone: "+91 124 5678 9012" },
      { name: "Kia Experience Center", city: "Bangalore", phone: "+91 80 2345 6780" }
    ]
  },
  {
    id: "26",
    name: "Kia EV6",
    brand: "Kia",
    model: "EV6",
    year: 2024,
    price: 6595000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 325,
    acceleration: "5.2s (0-100)",
    topSpeed: "188 kmph",
    image: "https://media.zigcdn.com/media/model/2025/Mar/front-1-4-left-1734646548_600x400.jpg",
    description: "Award-winning electric crossover with 800V ultra-fast charging.",
    features: ["800V Architecture", "V2L", "Relaxation Seats", "Augmented Reality HUD"],
    category: "Electric",
    dealers: [
      { name: "Kia EV Zone Mumbai", city: "Mumbai", phone: "+91 22 3456 7891" },
      { name: "Kia Electric Hub Delhi", city: "Delhi", phone: "+91 11 3456 7891" }
    ]
  },
  {
    id: "27",
    name: "Kia Carnival",
    brand: "Kia",
    model: "Carnival",
    year: 2024,
    price: 4399000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "8-speed Automatic",
    horsepower: 200,
    acceleration: "9.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://i.cdn.newsbytesapp.com/images/l13220240209102146.jpeg",
    description: "Premium limousine-class MPV with VIP lounge seating.",
    features: ["VIP Lounge Seats", "Dual Sunroof", "Bose Premium", "Power Sliding Doors"],
    category: "MPV",
    dealers: [
      { name: "Kia Signature Lounge", city: "Mumbai", phone: "+91 22 4567 8912" },
      { name: "Kia Premium Gallery", city: "Delhi", phone: "+91 11 4567 8912" }
    ]
  },
  {
    id: "28",
    name: "Kia Sonet",
    brand: "Kia",
    model: "Sonet",
    year: 2024,
    price: 1599000,
    mileage: 18,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 118,
    acceleration: "11.0s (0-100)",
    topSpeed: "175 kmph",
    image: "https://www.kia.com/content/dam/kia2/in/en/our-vehicles/showroom/sonet-pe/image/1920_10802.jpg",
    description: "Compact SUV with bold design and segment-first features.",
    features: ["Clutchless Manual", "Ventilated Seats", "Bose Audio", "Air Purifier"],
    category: "SUV",
    dealers: [
      { name: "Kia Connect Thane", city: "Mumbai", phone: "+91 22 5678 9123" },
      { name: "Kia Hub Noida", city: "Delhi NCR", phone: "+91 120 6789 0123" }
    ]
  },
  {
    id: "29",
    name: "Kia EV9",
    brand: "Kia",
    model: "EV9",
    year: 2024,
    price: 14999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 384,
    acceleration: "5.3s (0-100)",
    topSpeed: "200 kmph",
    image: "https://media.ed.edmunds-media.com/kia/ev9/2026/oem/2026_kia_ev9_4dr-suv_gt-line_fq_oem_1_1600.jpg",
    description: "Flagship 7-seater electric SUV with 541km range and 800V charging.",
    features: ["99.8kWh Battery", "Swivel Seats", "Digital Side Mirrors", "Highway Driving Pilot"],
    category: "Electric",
    dealers: [
      { name: "Kia Flagship BKC", city: "Mumbai", phone: "+91 22 6789 0134" },
      { name: "Kia Signature Delhi", city: "Delhi", phone: "+91 11 6789 0134" }
    ]
  },

  // MG MOTOR
  {
    id: "30",
    name: "MG Hector",
    brand: "MG Motor",
    model: "Hector",
    year: 2024,
    price: 2199000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "CVT",
    horsepower: 170,
    acceleration: "9.5s (0-100)",
    topSpeed: "185 kmph",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/MG/Hector/13125/1765801652897/exterior-image-164.jpg",
    description: "Internet car with 14-inch touchscreen and connected features.",
    features: ["i-SMART 2.0", "14-inch Touchscreen", "Panoramic Sunroof", "ADAS Level 2"],
    category: "SUV",
    dealers: [
      { name: "MG Motor Andheri", city: "Mumbai", phone: "+91 22 7890 1245" },
      { name: "MG Experience Rajouri", city: "Delhi", phone: "+91 11 7890 1245" },
      { name: "MG World Whitefield", city: "Bangalore", phone: "+91 80 7890 1245" }
    ]
  },
  {
    id: "31",
    name: "MG ZS EV",
    brand: "MG Motor",
    model: "ZS EV",
    year: 2024,
    price: 2499000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 177,
    acceleration: "8.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://ev-database.org/img/auto/MG_ZS_EV_2022/MG_ZS_EV_2022-01.jpg",
    description: "Pure electric SUV with 461km range and fast charging.",
    features: ["50.3kWh Battery", "i-SMART EV", "PM2.5 Filter", "Panoramic Sunroof"],
    category: "Electric",
    dealers: [
      { name: "MG EV Studio Mumbai", city: "Mumbai", phone: "+91 22 8901 2356" },
      { name: "MG Electric Hub Delhi", city: "Delhi", phone: "+91 11 8901 2356" }
    ]
  },
  {
    id: "32",
    name: "MG Gloster",
    brand: "MG Motor",
    model: "Gloster",
    year: 2024,
    price: 4299000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "8-speed Automatic",
    horsepower: 218,
    acceleration: "9.0s (0-100)",
    topSpeed: "185 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/129689/gloster-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80&q=80",
    description: "Full-size luxury SUV with 4x4 capability and ADAS Level 2.",
    features: ["ADAS Level 2", "4x4 with Low Range", "Captain Seats", "12.3-inch Display"],
    category: "SUV",
    dealers: [
      { name: "MG Premium Bandra", city: "Mumbai", phone: "+91 22 9012 3467" },
      { name: "MG Flagship Gurugram", city: "Gurgaon", phone: "+91 124 9012 3467" }
    ]
  },
  {
    id: "33",
    name: "MG Comet EV",
    brand: "MG Motor",
    model: "Comet EV",
    year: 2024,
    price: 899000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 42,
    acceleration: "15.0s (0-100)",
    topSpeed: "100 kmph",
    image: "https://images.timesdrive.in/photo/msid-151022240,thumbsize-493476/151022240.jpg",
    description: "India's most affordable electric car. Perfect for city commutes.",
    features: ["17.3kWh Battery", "Compact Design", "Fast Charging", "i-SMART App"],
    category: "Electric",
    dealers: [
      { name: "MG City Hub", city: "Mumbai", phone: "+91 22 0123 4578" },
      { name: "MG Urban Store", city: "Delhi", phone: "+91 11 0123 4578" }
    ]
  },
  {
    id: "34",
    name: "MG Windsor EV",
    brand: "MG Motor",
    model: "Windsor EV",
    year: 2024,
    price: 1699000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 136,
    acceleration: "9.8s (0-100)",
    topSpeed: "155 kmph",
    image: "https://images.timesdrive.in/photo/msid-151134804,thumbsize-572582/151134804.jpg",
    description: "Crossover Utility Vehicle with 332km range and Aeroglide Doors.",
    features: ["Aeroglide Doors", "BaaS Option", "38kWh Battery", "Aircraft-inspired Seats"],
    category: "Electric",
    dealers: [
      { name: "MG EV World Mumbai", city: "Mumbai", phone: "+91 22 1234 5689" },
      { name: "MG Electric Lounge", city: "Bangalore", phone: "+91 80 1234 5689" }
    ]
  },

  // TOYOTA
  {
    id: "35",
    name: "Toyota Innova Hycross",
    brand: "Toyota",
    model: "Innova Hycross",
    year: 2024,
    price: 2999000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 186,
    acceleration: "9.5s (0-100)",
    topSpeed: "180 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/115025/innova-hycross-exterior-right-front-three-quarter-72.jpeg?isig=0&q=80&q=80",
    description: "Premium MPV with self-charging hybrid delivering 21.1 kmpl.",
    features: ["Self-charging Hybrid", "Ottoman Seats", "Panoramic Sunroof", "JBL Audio"],
    category: "MPV",
    dealers: [
      { name: "Toyota Vikhroli", city: "Mumbai", phone: "+91 22 2345 6790" },
      { name: "Toyota Mathura Road", city: "Delhi", phone: "+91 11 2345 6790" },
      { name: "Toyota Rajajinagar", city: "Bangalore", phone: "+91 80 2345 6790" }
    ]
  },
  {
    id: "36",
    name: "Toyota Fortuner",
    brand: "Toyota",
    model: "Fortuner Legender",
    year: 2024,
    price: 4599000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 204,
    acceleration: "8.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/137767/fortuner-legender-exterior-left-front-three-quarter-5.jpeg?isig=0&q=80&q=80",
    description: "Legendary SUV with 4x4 capability and premium Legender styling.",
    features: ["4x4 with Low Range", "Crawl Control", "Wireless Charging", "JBL Premium"],
    category: "SUV",
    dealers: [
      { name: "Toyota World Worli", city: "Mumbai", phone: "+91 22 3456 7801" },
      { name: "Toyota Flagship Noida", city: "Delhi NCR", phone: "+91 120 4567 8901" }
    ]
  },
  {
    id: "37",
    name: "Toyota Camry",
    brand: "Toyota",
    model: "Camry",
    year: 2024,
    price: 4899000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 218,
    acceleration: "8.0s (0-100)",
    topSpeed: "200 kmph",
    image: "https://www.spinny.com/blog/wp-content/uploads/2024/12/Toyota-Camry-2025-Front-1160x653.webp",
    description: "Premium executive sedan with self-charging hybrid technology.",
    features: ["Self-charging Hybrid", "JBL Premium Audio", "Head-Up Display", "360° Camera"],
    category: "Sedan",
    dealers: [
      { name: "Toyota Premium BKC", city: "Mumbai", phone: "+91 22 4567 8912" },
      { name: "Toyota Executive Lounge", city: "Delhi", phone: "+91 11 4567 8912" }
    ]
  },
  {
    id: "38",
    name: "Toyota Land Cruiser",
    brand: "Toyota",
    model: "Land Cruiser",
    year: 2024,
    price: 21500000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "10-speed Automatic",
    horsepower: 309,
    acceleration: "7.0s (0-100)",
    topSpeed: "210 kmph",
    image: "https://imgcdn.zigwheels.vn/large/gallery/exterior/28/238/toyota-land-cruiser-front-angle-low-view-266389.jpg",
    description: "Legendary off-roader with TNGA-F platform and Multi-Terrain Select.",
    features: ["Multi-Terrain Select", "E-KDSS", "Crawl Control", "4-Zone Climate"],
    category: "Off-Road",
    dealers: [
      { name: "Toyota Flagship Mumbai", city: "Mumbai", phone: "+91 22 5678 9023" },
      { name: "Toyota Signature Delhi", city: "Delhi", phone: "+91 11 5678 9023" }
    ]
  },
  {
    id: "39",
    name: "Toyota Hilux",
    brand: "Toyota",
    model: "Hilux",
    year: 2024,
    price: 3399000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "6-speed Automatic",
    horsepower: 204,
    acceleration: "10.0s (0-100)",
    topSpeed: "175 kmph",
    image: "https://imgcdn.zigwheels.vn/large/gallery/exterior/28/648/toyota-hilux-front-angle-low-view-707033.jpg",
    description: "Tough pickup truck with legendary reliability and 4x4 capability.",
    features: ["4x4 with Low Range", "Rear Differential Lock", "Bedliner", "Touchscreen"],
    category: "Off-Road",
    dealers: [
      { name: "Toyota Commercial Bhiwandi", city: "Mumbai", phone: "+91 22 6789 0134" },
      { name: "Toyota Truck World", city: "Gurgaon", phone: "+91 124 7890 1234" }
    ]
  },
  {
    id: "40",
    name: "Toyota Vellfire",
    brand: "Toyota",
    model: "Vellfire",
    year: 2024,
    price: 12500000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 250,
    acceleration: "8.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://imgcdn.oto.com/large/gallery/exterior/38/2903/toyota-vellfire-hev-front-angle-low-view-407652.jpg",
    description: "Ultra-luxury MPV with Executive Lounge seats and hybrid efficiency.",
    features: ["Executive Lounge Seats", "Ottoman Function", "JBL Premium", "Dual Power Doors"],
    category: "MPV",
    dealers: [
      { name: "Toyota Luxury Bandra", city: "Mumbai", phone: "+91 22 7890 1245" },
      { name: "Toyota Executive Lounge", city: "Delhi", phone: "+91 11 7890 1245" }
    ]
  },

  // HONDA
  {
    id: "41",
    name: "Honda City",
    brand: "Honda",
    model: "City",
    year: 2024,
    price: 1999000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 126,
    acceleration: "10.0s (0-100)",
    topSpeed: "180 kmph",
    image: "https://gaadiwaadi.com/wp-content/uploads/2024/11/2025-honda-city-3.jpg",
    description: "Premium sedan with e:HEV strong hybrid technology.",
    features: ["e:HEV Hybrid", "Honda SENSING", "LaneWatch Camera", "Wireless Charging"],
    category: "Sedan",
    dealers: [
      { name: "Honda Cars Andheri", city: "Mumbai", phone: "+91 22 8901 2356" },
      { name: "Honda World Mathura Road", city: "Delhi", phone: "+91 11 8901 2356" },
      { name: "Honda MG Road", city: "Bangalore", phone: "+91 80 8901 2356" }
    ]
  },
  {
    id: "42",
    name: "Honda Elevate",
    brand: "Honda",
    model: "Elevate",
    year: 2024,
    price: 1599000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "CVT",
    horsepower: 121,
    acceleration: "11.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://c.ndtvimg.com/2025-01/18ajrav8_honda-elevate-black-edition_625x300_10_January_25.jpg?im=FaceCrop,algorithm=dnn,width=1200,height=800",
    description: "Urban SUV with Honda SENSING ADAS and premium features.",
    features: ["Honda SENSING", "LaneWatch", "Sunroof", "Connected Car"],
    category: "SUV",
    dealers: [
      { name: "Honda Motors Powai", city: "Mumbai", phone: "+91 22 9012 3467" },
      { name: "Honda Hub Gurugram", city: "Gurgaon", phone: "+91 124 0123 4567" }
    ]
  },
  {
    id: "43",
    name: "Honda Amaze",
    brand: "Honda",
    model: "Amaze",
    year: 2024,
    price: 1099000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "CVT",
    horsepower: 90,
    acceleration: "13.5s (0-100)",
    topSpeed: "165 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/184377/amaze-2024-exterior-left-front-three-quarter.jpeg?isig=0&q=80&q=80",
    description: "Compact sedan with spacious interior and efficient engine.",
    features: ["Cruise Control", "Push Button Start", "Touchscreen", "Rear Camera"],
    category: "Sedan",
    dealers: [
      { name: "Honda Express Thane", city: "Mumbai", phone: "+91 22 0123 4578" },
      { name: "Honda City Center", city: "Delhi", phone: "+91 11 0123 4578" }
    ]
  },

  // SKODA
  {
    id: "44",
    name: "Skoda Kodiaq",
    brand: "Skoda",
    model: "Kodiaq",
    year: 2024,
    price: 4299000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 190,
    acceleration: "8.0s (0-100)",
    topSpeed: "210 kmph",
    image: "https://cdn.skoda-storyboard.com/2025/02/28_Skoda_Kodiaq_RS_ce8ac346.jpg",
    description: "Premium 7-seater SUV with 4x4 capability and Laurin & Klement luxury.",
    features: ["4x4 AWD", "Virtual Cockpit", "Canton Sound", "Electric Tailgate"],
    category: "SUV",
    dealers: [
      { name: "Skoda Showroom BKC", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Skoda World Gurugram", city: "Gurgaon", phone: "+91 124 2345 6789" },
      { name: "Skoda Auto Koramangala", city: "Bangalore", phone: "+91 80 1234 5690" }
    ]
  },
  {
    id: "45",
    name: "Skoda Superb",
    brand: "Skoda",
    model: "Superb",
    year: 2024,
    price: 5499000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 190,
    acceleration: "7.8s (0-100)",
    topSpeed: "235 kmph",
    image: "https://media.drive.com.au/obj/tx_q:50,rs:auto:1920:1080:1/driveau/upload/cms/uploads/b2c5fca0-92c3-5fab-a981-19c7ce550000",
    description: "Flagship sedan with exceptional space and Laurin & Klement luxury.",
    features: ["Canton Sound", "Virtual Cockpit", "Heated Seats", "Alcantara Interior"],
    category: "Sedan",
    dealers: [
      { name: "Skoda Premium Worli", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "Skoda Flagship Delhi", city: "Delhi", phone: "+91 11 2345 6701" }
    ]
  },
  {
    id: "46",
    name: "Skoda Kushaq",
    brand: "Skoda",
    model: "Kushaq",
    year: 2024,
    price: 1999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 150,
    acceleration: "9.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/175993/kushaq-exterior-right-front-three-quarter.jpeg?isig=0&q=80&q=80",
    description: "Sporty SUV with Monte Carlo styling and TSI performance.",
    features: ["Monte Carlo Edition", "Sunroof", "Ventilated Seats", "Virtual Cockpit"],
    category: "SUV",
    dealers: [
      { name: "Skoda Motors Andheri", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "Skoda Connect Noida", city: "Delhi NCR", phone: "+91 120 5678 9012" }
    ]
  },
  {
    id: "47",
    name: "Skoda Slavia",
    brand: "Skoda",
    model: "Slavia",
    year: 2024,
    price: 1899000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 150,
    acceleration: "9.0s (0-100)",
    topSpeed: "205 kmph",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Skoda/Slavia/11810/1749703595725/exterior-image-169.jpg",
    description: "Premium sedan with sporty Monte Carlo styling and powerful TSI engine.",
    features: ["Monte Carlo Edition", "Virtual Cockpit", "Sunroof", "Connected Car"],
    category: "Sedan",
    dealers: [
      { name: "Skoda Express Thane", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "Skoda Hub Gurugram", city: "Gurgaon", phone: "+91 124 6789 0123" }
    ]
  },

  // VOLKSWAGEN
  {
    id: "48",
    name: "Volkswagen Taigun",
    brand: "Volkswagen",
    model: "Taigun",
    year: 2024,
    price: 1999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 150,
    acceleration: "9.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://assets.volkswagen.com/is/image/volkswagenag/taigun-sport-gallery-images-3-1?Zml0PWNyb3AsMSZmbXQ9cG5nJndpZD04MDAmYWxpZ249MC4wMCwwLjAwJmJmYz1vZmYmYzRiMA==",
    description: "German engineered SUV with TSI power and GT Line styling.",
    features: ["Active Cylinder Tech", "Ventilated Seats", "Sunroof", "Digital Cockpit"],
    category: "SUV",
    dealers: [
      { name: "Volkswagen Thane", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "Volkswagen Rajouri Garden", city: "Delhi", phone: "+91 11 5678 9034" },
      { name: "Volkswagen Marathahalli", city: "Bangalore", phone: "+91 80 5678 9034" }
    ]
  },
  {
    id: "49",
    name: "Volkswagen Virtus",
    brand: "Volkswagen",
    model: "Virtus",
    year: 2024,
    price: 1899000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 150,
    acceleration: "8.8s (0-100)",
    topSpeed: "210 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/144681/virtus-exterior-right-front-three-quarter-6.jpeg?isig=0&q=80&q=80",
    description: "Premium sedan with sporty GT styling and powerful TSI engine.",
    features: ["GT Line Styling", "Ventilated Seats", "Digital Cockpit", "Sunroof"],
    category: "Sedan",
    dealers: [
      { name: "Volkswagen Andheri", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "Volkswagen Gurugram", city: "Gurgaon", phone: "+91 124 7890 1234" }
    ]
  },
  {
    id: "50",
    name: "Volkswagen Tiguan",
    brand: "Volkswagen",
    model: "Tiguan",
    year: 2024,
    price: 3999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed DSG",
    horsepower: 190,
    acceleration: "8.0s (0-100)",
    topSpeed: "215 kmph",
    image: "https://media.vw.com/assets/images/hero/19218-my25-tiguan-sel-r-line-avocado-green-exterior-trahan-1129.jpg",
    description: "Premium SUV with 4MOTION AWD and German engineering excellence.",
    features: ["4MOTION AWD", "IQ.Light LED", "Harman Kardon", "Digital Cockpit Pro"],
    category: "SUV",
    dealers: [
      { name: "Volkswagen Premium BKC", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "Volkswagen Select Delhi", city: "Delhi", phone: "+91 11 7890 1256" }
    ]
  },

  // JEEP
  {
    id: "51",
    name: "Jeep Compass",
    brand: "Jeep",
    model: "Compass",
    year: 2024,
    price: 3599000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "9-speed Automatic",
    horsepower: 170,
    acceleration: "9.5s (0-100)",
    topSpeed: "185 kmph",
    image: "https://images.moneycontrol.com/static-mcnews/2021/02/Jeep-Compass.jpg?impolicy=website&width=1600&height=900",
    description: "Premium SUV with legendary Jeep 4x4 capability and Model S styling.",
    features: ["Jeep Active Drive", "Uconnect 5", "Panoramic Sunroof", "Alpine Audio"],
    category: "SUV",
    dealers: [
      { name: "Jeep World Mumbai", city: "Mumbai", phone: "+91 22 8901 2367" },
      { name: "Jeep Experience Delhi", city: "Delhi", phone: "+91 11 8901 2367" },
      { name: "Jeep Adventure Bangalore", city: "Bangalore", phone: "+91 80 8901 2367" }
    ]
  },
  {
    id: "52",
    name: "Jeep Meridian",
    brand: "Jeep",
    model: "Meridian",
    year: 2024,
    price: 4399000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "9-speed Automatic",
    horsepower: 170,
    acceleration: "10.0s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.drivespark.com/ph-big/2024/10/2025-jeep-meridian_172950743870.jpg",
    description: "3-row SUV with legendary Jeep 4x4 capability and premium features.",
    features: ["Jeep Active Drive", "Captain Seats", "Panoramic Sunroof", "Uconnect 5"],
    category: "SUV",
    dealers: [
      { name: "Jeep Premium Worli", city: "Mumbai", phone: "+91 22 9012 3478" },
      { name: "Jeep Flagship Gurugram", city: "Gurgaon", phone: "+91 124 0123 4567" }
    ]
  },
  {
    id: "53",
    name: "Jeep Wrangler",
    brand: "Jeep",
    model: "Wrangler Rubicon",
    year: 2024,
    price: 6799000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Automatic",
    horsepower: 272,
    acceleration: "8.5s (0-100)",
    topSpeed: "175 kmph",
    image: "https://www.evoindia.com/evoindia/2024-04/8b02e8ca-b2ce-48e7-ad29-37f947adebf5/Photo_17_04_24__10_32_27_AM.jpg",
    description: "Iconic off-roader with Rubicon trail-rated capability.",
    features: ["Rubicon 4x4", "Rock-Trac Transfer", "Dana 44 Axles", "Removable Top"],
    category: "Off-Road",
    dealers: [
      { name: "Jeep Iconic Mumbai", city: "Mumbai", phone: "+91 22 0123 4589" },
      { name: "Jeep Adventure Hub", city: "Delhi", phone: "+91 11 0123 4589" }
    ]
  },
  {
    id: "54",
    name: "Jeep Grand Cherokee",
    brand: "Jeep",
    model: "Grand Cherokee",
    year: 2024,
    price: 11999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Automatic",
    horsepower: 293,
    acceleration: "7.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/132711/grand-cherokee-exterior-right-front-three-quarter-27.jpeg?isig=0&q=80&q=80",
    description: "Flagship SUV with legendary capability and Summit Reserve luxury.",
    features: ["Quadra-Lift Air Suspension", "McIntosh Audio", "Selec-Terrain", "Night Vision"],
    category: "SUV",
    dealers: [
      { name: "Jeep Signature BKC", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Jeep Luxury Lounge", city: "Delhi", phone: "+91 11 1234 5690" }
    ]
  },

  // BMW
  {
    id: "55",
    name: "BMW 3 Series",
    brand: "BMW",
    model: "330Li M Sport",
    year: 2024,
    price: 6299000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Steptronic",
    horsepower: 258,
    acceleration: "6.2s (0-100)",
    topSpeed: "250 kmph",
    image: "https://media.adtorqueedge.com/new-cars/bmw-my/3-series-gran-sedan/design1.jpg",
    description: "The ultimate driving machine with M Sport styling and long wheelbase.",
    features: ["M Sport Package", "Live Cockpit Pro", "Harman Kardon", "Gesture Control"],
    category: "Sports",
    dealers: [
      { name: "BMW Infinity Cars Worli", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "BMW Deutsche Motoren", city: "Delhi", phone: "+91 11 2345 6701" },
      { name: "BMW Navnit Motors", city: "Bangalore", phone: "+91 80 2345 6701" }
    ]
  },
  {
    id: "56",
    name: "BMW X5",
    brand: "BMW",
    model: "X5 M Sport",
    year: 2024,
    price: 10999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Steptronic",
    horsepower: 340,
    acceleration: "5.4s (0-100)",
    topSpeed: "243 kmph",
    image: "https://images.hindustantimes.com/auto/img/2020/11/26/1600x900/BMW_X5_M_Competition_(1)_1606369534114_1606369541345.jpg",
    description: "Sports Activity Vehicle with commanding presence and M Sport dynamics.",
    features: ["xDrive AWD", "Adaptive M Suspension", "Bowers & Wilkins", "Panoramic Sky Lounge"],
    category: "SUV",
    dealers: [
      { name: "BMW Gallops BKC", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "BMW Bird Automotive", city: "Delhi", phone: "+91 11 3456 7812" }
    ]
  },
  {
    id: "57",
    name: "BMW M4 Competition",
    brand: "BMW",
    model: "M4 Competition",
    year: 2024,
    price: 15299000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed M Steptronic",
    horsepower: 510,
    acceleration: "3.5s (0-100)",
    topSpeed: "290 kmph",
    image: "https://www.bmw-m.com/content/dam/bmw/marketBMW_M/www_bmw-m_com/all-models/m-automobile/m4-x-kith/bmw-m4-x-kith-stage-01.jpg",
    description: "Ultimate sports coupe with M TwinPower Turbo and racing DNA.",
    features: ["M xDrive", "M Carbon Bucket Seats", "M Drive Professional", "Harman Kardon"],
    category: "Sports",
    dealers: [
      { name: "BMW M Studio Mumbai", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "BMW M Performance Delhi", city: "Delhi", phone: "+91 11 4567 8923" }
    ]
  },
  {
    id: "58",
    name: "BMW iX",
    brand: "BMW",
    model: "iX",
    year: 2024,
    price: 12999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed",
    horsepower: 523,
    acceleration: "4.6s (0-100)",
    topSpeed: "200 kmph",
    image: "https://english.cdn.zeenews.com/sites/default/files/2022/01/05/1002556-2023-bmw-ix-m60-exterior.jpg",
    description: "Electric flagship SAV with 630km range and innovative design.",
    features: ["111.5kWh Battery", "Curved Display", "Shy Tech", "Bowers & Wilkins 4D"],
    category: "Electric",
    dealers: [
      { name: "BMW i Studio Mumbai", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "BMW Electric Hub Delhi", city: "Delhi", phone: "+91 11 5678 9034" }
    ]
  },
  {
    id: "59",
    name: "BMW 7 Series",
    brand: "BMW",
    model: "740i M Sport",
    year: 2024,
    price: 17599000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Steptronic",
    horsepower: 380,
    acceleration: "5.0s (0-100)",
    topSpeed: "250 kmph",
    image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/BMW/7-Series/10575/1689671971561/exterior-image-165.jpg",
    description: "Flagship luxury sedan with Theatre Screen and Executive Lounge.",
    features: ["31-inch Theatre Screen", "Executive Lounge", "Sky Lounge", "Bowers & Wilkins Diamond"],
    category: "Sedan",
    dealers: [
      { name: "BMW Signature Mumbai", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "BMW Prestige Delhi", city: "Delhi", phone: "+91 11 6789 0145" }
    ]
  },

  // MERCEDES-BENZ
  {
    id: "60",
    name: "Mercedes-Benz C-Class",
    brand: "Mercedes-Benz",
    model: "C 300d AMG",
    year: 2024,
    price: 6999000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "9G-TRONIC",
    horsepower: 265,
    acceleration: "5.7s (0-100)",
    topSpeed: "250 kmph",
    image: "https://hips.hearstapps.com/mtg-prod/671005298159240008c4421b/6-2025-mercedes-benz-amg-c63s-e-performance-front-view.jpg",
    description: "The best or nothing. Luxury sedan with AMG Line styling.",
    features: ["AMG Line", "MBUX Hyperscreen", "Burmester 3D", "Digital Light"],
    category: "Sedan",
    dealers: [
      { name: "Mercedes-Benz Shaman Wheels", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "Mercedes-Benz T&T Motors", city: "Delhi", phone: "+91 11 7890 1256" },
      { name: "Mercedes-Benz Akshaya Motors", city: "Bangalore", phone: "+91 80 7890 1256" }
    ]
  },
  {
    id: "61",
    name: "Mercedes-Benz GLC",
    brand: "Mercedes-Benz",
    model: "GLC 300",
    year: 2024,
    price: 8299000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "9G-TRONIC",
    horsepower: 258,
    acceleration: "6.2s (0-100)",
    topSpeed: "240 kmph",
    image: "https://www.hdwallpapers.in/download/mercedes_benz_glc_300_4matic_avantgarde_2022_4k_5k_hd_cars-HD.jpg",
    description: "Premium SUV with 4MATIC AWD and luxury features.",
    features: ["4MATIC AWD", "MBUX", "Burmester", "Air Suspension"],
    category: "SUV",
    dealers: [
      { name: "Mercedes-Benz Shaman BKC", city: "Mumbai", phone: "+91 22 8901 2367" },
      { name: "Mercedes-Benz Silver Star", city: "Delhi", phone: "+91 11 8901 2367" }
    ]
  },
  {
    id: "62",
    name: "Mercedes-AMG GT",
    brand: "Mercedes-Benz",
    model: "AMG GT 63 S",
    year: 2024,
    price: 26999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "AMG SPEEDSHIFT MCT 9G",
    horsepower: 639,
    acceleration: "3.2s (0-100)",
    topSpeed: "315 kmph",
    image: "https://cimg0.ibsrv.net/ibimg/hgm/1920x1080-1/100/955/mercedes-benz-amg-gt_100955680.jpg",
    description: "Handcrafted AMG performance with V8 biturbo power.",
    features: ["AMG Performance Exhaust", "Nappa Leather", "Burmester 3D High-End", "AMG Track Pace"],
    category: "Supercar",
    dealers: [
      { name: "Mercedes-AMG Performance Center", city: "Mumbai", phone: "+91 22 9012 3478" },
      { name: "Mercedes-AMG Delhi", city: "Delhi", phone: "+91 11 9012 3478" }
    ]
  },
  {
    id: "63",
    name: "Mercedes-Benz EQS",
    brand: "Mercedes-Benz",
    model: "EQS 580",
    year: 2024,
    price: 19999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed",
    horsepower: 523,
    acceleration: "4.3s (0-100)",
    topSpeed: "210 kmph",
    image: "https://media.ed.edmunds-media.com/mercedes-benz/eqs-suv/2025/oem/2025_mercedes-benz_eqs-suv_4dr-suv_eqs-580-4matic_fq_oem_1_1600.jpg",
    description: "Electric luxury sedan with 857km range and MBUX Hyperscreen.",
    features: ["107.8kWh Battery", "MBUX Hyperscreen", "4MATIC+", "Air Balance"],
    category: "Electric",
    dealers: [
      { name: "Mercedes EQ Studio Mumbai", city: "Mumbai", phone: "+91 22 0123 4589" },
      { name: "Mercedes EQ Hub Delhi", city: "Delhi", phone: "+91 11 0123 4589" }
    ]
  },
  {
    id: "64",
    name: "Mercedes-Benz GLS",
    brand: "Mercedes-Benz",
    model: "GLS 450",
    year: 2024,
    price: 13999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "9G-TRONIC",
    horsepower: 367,
    acceleration: "5.9s (0-100)",
    topSpeed: "245 kmph",
    image: "https://di-uploads-pod3.dealerinspire.com/fletcherjonesmbnewport/uploads/2024/09/2025-GLS-overview-design-AMG-GLS-63.png",
    description: "The S-Class of SUVs with ultimate luxury and space.",
    features: ["E-Active Body Control", "Burmester 3D", "Executive Rear Seats", "MBUX"],
    category: "SUV",
    dealers: [
      { name: "Mercedes-Benz Flagship Mumbai", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Mercedes-Benz WOHCARS Delhi", city: "Delhi", phone: "+91 11 1234 5690" }
    ]
  },
  {
    id: "65",
    name: "Mercedes-Maybach S-Class",
    brand: "Mercedes-Benz",
    model: "Maybach S 680",
    year: 2024,
    price: 32999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "9G-TRONIC",
    horsepower: 612,
    acceleration: "4.4s (0-100)",
    topSpeed: "250 kmph",
    image: "https://di-uploads-pod3.dealerinspire.com/fletcherjonesmbnewport/uploads/2025/02/2025-maybach-s-class-sedan-hero-desktop-min.jpg",
    description: "Ultimate luxury sedan with V12 power and Maybach exclusivity.",
    features: ["V12 Engine", "Executive Seats", "Champagne Flutes", "Magic Sky Control"],
    category: "Sedan",
    dealers: [
      { name: "Mercedes-Maybach Boutique", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "Mercedes-Maybach Atelier", city: "Delhi", phone: "+91 11 2345 6701" }
    ]
  },

  // AUDI
  {
    id: "66",
    name: "Audi A4",
    brand: "Audi",
    model: "A4",
    year: 2024,
    price: 5299000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed S tronic",
    horsepower: 190,
    acceleration: "7.3s (0-100)",
    topSpeed: "241 kmph",
    image: "https://media.drive.com.au/obj/tx_q:50,rs:auto:1920:1080:1/driveau/upload/cms/uploads/e64b5172-4f76-5b5f-b3d4-f9b1d0250000",
    description: "Progressive luxury sedan with Quattro DNA and refined elegance.",
    features: ["Virtual Cockpit Plus", "MMI Touch", "B&O 3D Sound", "Matrix LED"],
    category: "Sedan",
    dealers: [
      { name: "Audi Mumbai Central", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "Audi Delhi West", city: "Delhi", phone: "+91 11 3456 7812" },
      { name: "Audi Bangalore", city: "Bangalore", phone: "+91 80 3456 7812" }
    ]
  },
  {
    id: "67",
    name: "Audi Q7",
    brand: "Audi",
    model: "Q7",
    year: 2024,
    price: 10999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Tiptronic",
    horsepower: 340,
    acceleration: "5.9s (0-100)",
    topSpeed: "250 kmph",
    image: "https://cdn.motor1.com/images/mgl/2NQvzK/s1/2025-audi-q7-review.jpg",
    description: "Full-size luxury SUV with Quattro AWD and premium features.",
    features: ["Quattro AWD", "Air Suspension", "B&O 3D", "HD Matrix LED"],
    category: "SUV",
    dealers: [
      { name: "Audi BKC", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "Audi Gurugram", city: "Gurgaon", phone: "+91 124 8901 2345" }
    ]
  },
  {
    id: "68",
    name: "Audi RS7 Sportback",
    brand: "Audi",
    model: "RS7",
    year: 2024,
    price: 19499000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Tiptronic",
    horsepower: 600,
    acceleration: "3.6s (0-100)",
    topSpeed: "305 kmph",
    image: "https://www.velocityjournal.com/images/new/2024/885/840/ad2024a7rs7885102816_1200.jpg",
    description: "Where performance meets versatility. RS power in a stunning design.",
    features: ["Quattro Sport Differential", "RS Adaptive Air Suspension", "Bang & Olufsen 3D", "Matrix LED"],
    category: "Sports",
    dealers: [
      { name: "Audi Sport Mumbai", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "Audi RS Studio Delhi", city: "Delhi", phone: "+91 11 5678 9034" }
    ]
  },
  {
    id: "69",
    name: "Audi e-tron GT",
    brand: "Audi",
    model: "e-Tron GT",
    year: 2024,
    price: 18999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "2-speed Automatic",
    horsepower: 476,
    acceleration: "4.1s (0-100)",
    topSpeed: "245 kmph",
    image: "https://media.drive.com.au/obj/tx_q:50,rs:auto:1920:1080:1/driveau/upload/cms/uploads/17b22caf-6fa1-5c5d-8408-4d0bcb450000",
    description: "Electric grand tourer with 800V architecture and stunning design.",
    features: ["800V Fast Charging", "Quattro e-AWD", "Bang & Olufsen", "Matrix LED"],
    category: "Electric",
    dealers: [
      { name: "Audi e-tron Studio Mumbai", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "Audi Electric Hub Delhi", city: "Delhi", phone: "+91 11 6789 0145" }
    ]
  },
  {
    id: "70",
    name: "Audi Q8",
    brand: "Audi",
    model: "Q8",
    year: 2024,
    price: 12999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Tiptronic",
    horsepower: 340,
    acceleration: "5.9s (0-100)",
    topSpeed: "250 kmph",
    image: "https://imgd.aeplcdn.com/1920x1080/n/cw/ec/184519/q8-exterior-left-front-three-quarter.jpeg?isig=0&q=80&q=80",
    description: "Flagship SUV coupe with bold design and quattro performance.",
    features: ["Quattro AWD", "MMI Touch Response", "Virtual Cockpit", "B&O 3D Sound"],
    category: "SUV",
    dealers: [
      { name: "Audi Flagship Mumbai", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "Audi Prestige Delhi", city: "Delhi", phone: "+91 11 7890 1256" }
    ]
  },

  // PORSCHE
  {
    id: "71",
    name: "Porsche 911 Carrera",
    brand: "Porsche",
    model: "911 Carrera",
    year: 2024,
    price: 17599000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed PDK",
    horsepower: 450,
    acceleration: "3.5s (0-100)",
    topSpeed: "308 kmph",
    image: "https://www.porschelittlerock.com/static/dealer-25469/2025_Porsche_911_Carrera_T_/img_36_1.49.09_PM.webp",
    description: "Iconic sports car that defines automotive excellence.",
    features: ["Sport Chrono Package", "PASM Sport Suspension", "Bose Surround", "LED Matrix"],
    category: "Sports",
    dealers: [
      { name: "Porsche Centre Mumbai", city: "Mumbai", phone: "+91 22 8901 2367" },
      { name: "Porsche Delhi", city: "Delhi", phone: "+91 11 8901 2367" },
      { name: "Porsche Bangalore", city: "Bangalore", phone: "+91 80 8901 2367" }
    ]
  },
  {
    id: "72",
    name: "Porsche Cayenne",
    brand: "Porsche",
    model: "Cayenne Coupe",
    year: 2024,
    price: 14999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Tiptronic S",
    horsepower: 353,
    acceleration: "5.9s (0-100)",
    topSpeed: "243 kmph",
    image: "https://i.ytimg.com/vi/kA3l7t8YkVM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBq2Lee6TOO4VoZpYVukSW_QbDpUw",
    description: "Sports car soul in an SUV body with coupe styling.",
    features: ["Active Suspension", "Panoramic Roof", "Bose Surround", "Sport Chrono"],
    category: "SUV",
    dealers: [
      { name: "Porsche Centre Mumbai", city: "Mumbai", phone: "+91 22 9012 3478" },
      { name: "Porsche Delhi", city: "Delhi", phone: "+91 11 9012 3478" }
    ]
  },
  {
    id: "73",
    name: "Porsche Taycan",
    brand: "Porsche",
    model: "Taycan",
    year: 2024,
    price: 16999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "2-speed Automatic",
    horsepower: 571,
    acceleration: "4.0s (0-100)",
    topSpeed: "250 kmph",
    image: "https://www.evoindia.com/h-upload/2025/05/13/461476-porschexresonatemediahousedubai-1.webp",
    description: "Electric sports car with 800V architecture and Porsche DNA.",
    features: ["800V Fast Charging", "Performance Battery Plus", "Adaptive Air Suspension", "Bose"],
    category: "Electric",
    dealers: [
      { name: "Porsche Electric Mumbai", city: "Mumbai", phone: "+91 22 0123 4589" },
      { name: "Porsche EV Delhi", city: "Delhi", phone: "+91 11 0123 4589" }
    ]
  },
  {
    id: "74",
    name: "Porsche Panamera",
    brand: "Porsche",
    model: "Panamera",
    year: 2024,
    price: 19999000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "8-speed PDK",
    horsepower: 462,
    acceleration: "4.4s (0-100)",
    topSpeed: "280 kmph",
    image: "https://www.autotrader.ca/editorial/media/tqrc2fvr/2025-porsche-panamera-e-hybrids-jl-22.jpg?width=1920&height=1080&v=1daa2dde59880e0",
    description: "Luxury sports sedan with plug-in hybrid efficiency.",
    features: ["E-Hybrid", "Air Suspension", "Bose Surround", "Porsche Active Ride"],
    category: "Gran Turismo",
    dealers: [
      { name: "Porsche Centre Mumbai", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Porsche Delhi", city: "Delhi", phone: "+91 11 1234 5690" }
    ]
  },
  {
    id: "75",
    name: "Porsche Macan",
    brand: "Porsche",
    model: "Macan GTS",
    year: 2024,
    price: 10999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed PDK",
    horsepower: 440,
    acceleration: "4.3s (0-100)",
    topSpeed: "272 kmph",
    image: "https://hips.hearstapps.com/hmg-prod/images/2022-porsche-macan-101-1651084695.jpg?crop=0.574xw:0.483xh;0.327xw,0.358xh&resize=1200:*",
    description: "Compact SUV with GTS performance and everyday usability.",
    features: ["GTS Sport Package", "Air Suspension", "Sport Chrono", "Bose Surround"],
    category: "SUV",
    dealers: [
      { name: "Porsche Centre Mumbai", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "Porsche Delhi", city: "Delhi", phone: "+91 11 2345 6701" }
    ]
  },

  // JAGUAR LAND ROVER
  {
    id: "76",
    name: "Range Rover",
    brand: "Land Rover",
    model: "Range Rover Autobiography",
    year: 2024,
    price: 35999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed ZF Automatic",
    horsepower: 523,
    acceleration: "4.6s (0-100)",
    topSpeed: "250 kmph",
    image: "https://4kwallpapers.com/images/wallpapers/range-rover-autobiography-2022-5k-2880x1800-7982.jpg",
    description: "Ultimate luxury SUV with modern design and unmatched refinement.",
    features: ["Executive Class Seats", "Meridian Signature", "Air Suspension", "Terrain Response 2"],
    category: "SUV",
    dealers: [
      { name: "Land Rover Worli", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "Land Rover Delhi", city: "Delhi", phone: "+91 11 3456 7812" },
      { name: "Land Rover Bangalore", city: "Bangalore", phone: "+91 80 3456 7812" }
    ]
  },
  {
    id: "77",
    name: "Range Rover Sport",
    brand: "Land Rover",
    model: "Range Rover Sport",
    year: 2024,
    price: 15999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed ZF Automatic",
    horsepower: 400,
    acceleration: "5.7s (0-100)",
    topSpeed: "242 kmph",
    image: "https://hips.hearstapps.com/mtg-prod/6691ac06ebd0de0008230191/4-2025-land-rover-range-rover-sport-front-view.jpg",
    description: "Sporting luxury with exceptional all-terrain capability.",
    features: ["Dynamic Air Suspension", "Meridian Sound", "Terrain Response 2", "ClearSight"],
    category: "SUV",
    dealers: [
      { name: "Land Rover BKC", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "Land Rover Gurugram", city: "Gurgaon", phone: "+91 124 9012 3456" }
    ]
  },
  {
    id: "78",
    name: "Land Rover Defender",
    brand: "Land Rover",
    model: "Defender",
    year: 2024,
    price: 13999000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "8-speed ZF Automatic",
    horsepower: 300,
    acceleration: "7.0s (0-100)",
    topSpeed: "191 kmph",
    image: "https://img.sm360.ca/images/web/jaguar-land-rover-laval/3559/header_11655398817176.png",
    description: "Iconic off-roader reimagined with modern capability.",
    features: ["Terrain Response 2", "ClearSight Ground View", "Electronic Air Suspension", "Meridian"],
    category: "Off-Road",
    dealers: [
      { name: "Land Rover Adventure Mumbai", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "Land Rover Expedition Delhi", city: "Delhi", phone: "+91 11 5678 9034" }
    ]
  },
  {
    id: "79",
    name: "Jaguar F-PACE",
    brand: "Jaguar",
    model: "F-PACE",
    year: 2024,
    price: 9999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed ZF Automatic",
    horsepower: 400,
    acceleration: "5.4s (0-100)",
    topSpeed: "250 kmph",
    image: "https://www.carbike360.com/_next/image?url=https%3A%2F%2Fs3.ap-south-1.amazonaws.com%2Fcb360static%2Fuploads%2Fa6b03c6d-bc68-489d-88e8-7b4b954d54b6-small-Jaguar%2520F-Pace%2520%25282%2529.avif&w=3840&q=75",
    description: "Performance SUV with Jaguar DNA and stunning design.",
    features: ["Active Dynamics", "Meridian Sound", "ClearSight Mirror", "Configurable Dynamics"],
    category: "SUV",
    dealers: [
      { name: "Jaguar Mumbai", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "Jaguar Delhi", city: "Delhi", phone: "+91 11 6789 0145" }
    ]
  },
  {
    id: "80",
    name: "Jaguar I-PACE",
    brand: "Jaguar",
    model: "I-PACE EV400",
    year: 2024,
    price: 11999000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 400,
    acceleration: "4.8s (0-100)",
    topSpeed: "200 kmph",
    image: "https://media.zigcdn.com/media/model/2023/Feb/front-1-4-left-1788808189_600x400.jpg",
    description: "Award-winning electric performance SUV with 470km range.",
    features: ["90kWh Battery", "Meridian 3D", "ClearSight Mirror", "Adaptive Dynamics"],
    category: "Electric",
    dealers: [
      { name: "Jaguar Electric Mumbai", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "Jaguar EV Delhi", city: "Delhi", phone: "+91 11 7890 1256" }
    ]
  },

  // LAMBORGHINI
  {
    id: "81",
    name: "Lamborghini Huracán",
    brand: "Lamborghini",
    model: "Huracán",
    year: 2024,
    price: 45000000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed LDF",
    horsepower: 640,
    acceleration: "3.2s (0-100)",
    topSpeed: "325 kmph",
    image: "https://images.pexels.com/photos/30550072/pexels-photo-30550072/free-photo-of-sleek-lamborghini-huracan-in-scenic-landscape.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    description: "Naturally aspirated V10 delivering pure Italian supercar experience.",
    features: ["LDVI System", "MagneRide Suspension", "Performance Traction Control", "Alcantara Interior"],
    category: "Supercar",
    dealers: [
      { name: "Lamborghini Mumbai", city: "Mumbai", phone: "+91 22 8901 2367" },
      { name: "Lamborghini Delhi", city: "Delhi", phone: "+91 11 8901 2367" }
    ]
  },
  {
    id: "82",
    name: "Lamborghini Urus",
    brand: "Lamborghini",
    model: "Urus",
    year: 2024,
    price: 45000000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Automatic",
    horsepower: 666,
    acceleration: "3.3s (0-100)",
    topSpeed: "306 kmph",
    image: "https://media.drive.com.au/obj/tx_q:50,rs:auto:1920:1080:1/driveau/upload/cms/uploads/e0aa4fd8-7ba9-5bf0-8c30-a8457bb50000",
    description: "World's fastest super SUV with incredible performance.",
    features: ["Torque Vectoring", "Active Roll Stabilization", "Carbon Fiber Pack", "Bang & Olufsen"],
    category: "Supercar",
    dealers: [
      { name: "Lamborghini Mumbai", city: "Mumbai", phone: "+91 22 9012 3478" },
      { name: "Lamborghini Delhi", city: "Delhi", phone: "+91 11 9012 3478" }
    ]
  },

  // FERRARI
  {
    id: "83",
    name: "Ferrari Roma",
    brand: "Ferrari",
    model: "Roma",
    year: 2024,
    price: 39999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed DCT",
    horsepower: 620,
    acceleration: "3.4s (0-100)",
    topSpeed: "320 kmph",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80",
    description: "La Nuova Dolce Vita. Elegant GT with twin-turbo V8 power.",
    features: ["Manettino", "Virtual Short Wheelbase", "Ferrari Virtual Cockpit", "JBL Premium"],
    category: "Supercar",
    dealers: [
      { name: "Ferrari Mumbai", city: "Mumbai", phone: "+91 22 0123 4589" },
      { name: "Ferrari Delhi", city: "Delhi", phone: "+91 11 0123 4589" }
    ]
  },
  {
    id: "84",
    name: "Ferrari Purosangue",
    brand: "Ferrari",
    model: "Purosangue",
    year: 2024,
    price: 65000000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed DCT",
    horsepower: 725,
    acceleration: "3.3s (0-100)",
    topSpeed: "310 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "First ever Ferrari four-door, four-seater with V12 power.",
    features: ["V12 Engine", "Active Suspension", "Burmester 3D", "Suicide Doors"],
    category: "Supercar",
    dealers: [
      { name: "Ferrari Mumbai", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Ferrari Delhi", city: "Delhi", phone: "+91 11 1234 5690" }
    ]
  },

  // BENTLEY
  {
    id: "85",
    name: "Bentley Continental GT",
    brand: "Bentley",
    model: "Continental GT Speed",
    year: 2024,
    price: 45000000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed DCT",
    horsepower: 659,
    acceleration: "3.5s (0-100)",
    topSpeed: "335 kmph",
    image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=800&q=80",
    description: "Definitive grand tourer with handcrafted W12 luxury.",
    features: ["Naim Audio", "Diamond Quilted Leather", "Rotating Display", "48V Active Anti-Roll"],
    category: "Grand Tourer",
    dealers: [
      { name: "Bentley Mumbai", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "Bentley Delhi", city: "Delhi", phone: "+91 11 2345 6701" }
    ]
  },
  {
    id: "86",
    name: "Bentley Bentayga",
    brand: "Bentley",
    model: "Bentayga Speed",
    year: 2024,
    price: 49999000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Automatic",
    horsepower: 635,
    acceleration: "3.9s (0-100)",
    topSpeed: "306 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "World's fastest, most luxurious SUV with W12 power.",
    features: ["W12 Engine", "Naim Audio", "Mulliner Driving Spec", "All-Terrain Spec"],
    category: "SUV",
    dealers: [
      { name: "Bentley Mumbai", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "Bentley Delhi", city: "Delhi", phone: "+91 11 3456 7812" }
    ]
  },

  // ROLLS-ROYCE
  {
    id: "87",
    name: "Rolls-Royce Ghost",
    brand: "Rolls-Royce",
    model: "Ghost Extended",
    year: 2024,
    price: 77500000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed ZF Automatic",
    horsepower: 571,
    acceleration: "4.6s (0-100)",
    topSpeed: "250 kmph",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    description: "Post opulence luxury with minimalist design and V12 refinement.",
    features: ["Starlight Headliner", "Planar Suspension", "Bespoke Audio", "Illuminated Fascia"],
    category: "Sedan",
    dealers: [
      { name: "Rolls-Royce Mumbai", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "Rolls-Royce Delhi", city: "Delhi", phone: "+91 11 4567 8923" }
    ]
  },
  {
    id: "88",
    name: "Rolls-Royce Cullinan",
    brand: "Rolls-Royce",
    model: "Cullinan Black Badge",
    year: 2024,
    price: 95000000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed ZF Automatic",
    horsepower: 600,
    acceleration: "4.9s (0-100)",
    topSpeed: "250 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Diamond of SUVs with Black Badge power and presence.",
    features: ["Black Badge Power", "Viewing Suite", "Starlight Headliner", "Night Vision"],
    category: "SUV",
    dealers: [
      { name: "Rolls-Royce Mumbai", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "Rolls-Royce Delhi", city: "Delhi", phone: "+91 11 5678 9034" }
    ]
  },
  {
    id: "89",
    name: "Rolls-Royce Spectre",
    brand: "Rolls-Royce",
    model: "Spectre",
    year: 2024,
    price: 75000000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 585,
    acceleration: "4.5s (0-100)",
    topSpeed: "250 kmph",
    image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
    description: "First fully electric Rolls-Royce with 530km range.",
    features: ["102kWh Battery", "Planar Suspension", "Starlight Doors", "Spirit of Ecstasy Illuminated"],
    category: "Electric",
    dealers: [
      { name: "Rolls-Royce Mumbai", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "Rolls-Royce Delhi", city: "Delhi", phone: "+91 11 6789 0145" }
    ]
  },

  // VOLVO
  {
    id: "90",
    name: "Volvo XC90",
    brand: "Volvo",
    model: "XC90 Ultimate B6 AWD",
    year: 2024,
    price: 9999000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "8-speed Geartronic",
    horsepower: 300,
    acceleration: "6.9s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Scandinavian luxury SUV with ultimate safety and comfort.",
    features: ["Bowers & Wilkins", "Air Suspension", "Pilot Assist", "Orrefors Crystal"],
    category: "SUV",
    dealers: [
      { name: "Volvo Cars Mumbai", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "Volvo Delhi", city: "Delhi", phone: "+91 11 7890 1256" },
      { name: "Volvo Bangalore", city: "Bangalore", phone: "+91 80 7890 1256" }
    ]
  },
  {
    id: "91",
    name: "Volvo XC60",
    brand: "Volvo",
    model: "XC60 Ultimate B5 AWD",
    year: 2024,
    price: 7299000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "8-speed Geartronic",
    horsepower: 250,
    acceleration: "7.3s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Premium mid-size SUV with world-class safety.",
    features: ["Bowers & Wilkins", "Air Suspension", "Pilot Assist", "Crystal Gear Shifter"],
    category: "SUV",
    dealers: [
      { name: "Volvo Cars Worli", city: "Mumbai", phone: "+91 22 8901 2367" },
      { name: "Volvo Gurugram", city: "Gurgaon", phone: "+91 124 0123 4567" }
    ]
  },
  {
    id: "92",
    name: "Volvo S90",
    brand: "Volvo",
    model: "S90 Ultimate B5",
    year: 2024,
    price: 6999000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "8-speed Geartronic",
    horsepower: 250,
    acceleration: "7.5s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
    description: "Elegant executive sedan with Scandinavian luxury.",
    features: ["Bowers & Wilkins", "Air Suspension", "Pilot Assist", "Nappa Leather"],
    category: "Sedan",
    dealers: [
      { name: "Volvo Cars Mumbai", city: "Mumbai", phone: "+91 22 9012 3478" },
      { name: "Volvo Delhi", city: "Delhi", phone: "+91 11 9012 3478" }
    ]
  },

  // LEXUS
  {
    id: "93",
    name: "Lexus ES",
    brand: "Lexus",
    model: "ES 300h Exquisite",
    year: 2024,
    price: 6499000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 218,
    acceleration: "8.9s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
    description: "Progressive luxury sedan with self-charging hybrid technology.",
    features: ["Self-charging Hybrid", "Mark Levinson Audio", "Safety System+", "Climate Concierge"],
    category: "Sedan",
    dealers: [
      { name: "Lexus Mumbai", city: "Mumbai", phone: "+91 22 0123 4589" },
      { name: "Lexus Delhi", city: "Delhi", phone: "+91 11 0123 4589" },
      { name: "Lexus Bangalore", city: "Bangalore", phone: "+91 80 0123 4589" }
    ]
  },
  {
    id: "94",
    name: "Lexus NX",
    brand: "Lexus",
    model: "NX 350h Exquisite",
    year: 2024,
    price: 7199000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 244,
    acceleration: "7.7s (0-100)",
    topSpeed: "200 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Premium compact SUV with bold design and hybrid efficiency.",
    features: ["Self-charging Hybrid", "Mark Levinson", "Lexus Interface", "E-Latch"],
    category: "SUV",
    dealers: [
      { name: "Lexus Mumbai", city: "Mumbai", phone: "+91 22 1234 5690" },
      { name: "Lexus Delhi", city: "Delhi", phone: "+91 11 1234 5690" }
    ]
  },
  {
    id: "95",
    name: "Lexus RX",
    brand: "Lexus",
    model: "RX 500h F Sport",
    year: 2024,
    price: 9599000,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "eCVT",
    horsepower: 371,
    acceleration: "6.0s (0-100)",
    topSpeed: "250 kmph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Luxury SUV with F Sport performance and hybrid power.",
    features: ["Direct4 AWD", "Adaptive Variable Suspension", "Mark Levinson", "Safety System+"],
    category: "SUV",
    dealers: [
      { name: "Lexus Mumbai", city: "Mumbai", phone: "+91 22 2345 6701" },
      { name: "Lexus Delhi", city: "Delhi", phone: "+91 11 2345 6701" }
    ]
  },
  {
    id: "96",
    name: "Lexus LX",
    brand: "Lexus",
    model: "LX 500d",
    year: 2024,
    price: 29999000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "10-speed Automatic",
    horsepower: 305,
    acceleration: "6.7s (0-100)",
    topSpeed: "210 kmph",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
    description: "Flagship luxury SUV with legendary off-road capability.",
    features: ["Multi Terrain Select", "Crawl Control", "Mark Levinson Reference", "Executive Seats"],
    category: "SUV",
    dealers: [
      { name: "Lexus Mumbai", city: "Mumbai", phone: "+91 22 3456 7812" },
      { name: "Lexus Delhi", city: "Delhi", phone: "+91 11 3456 7812" }
    ]
  },

  // CITROEN
  {
    id: "97",
    name: "Citroen C5 Aircross",
    brand: "Citroen",
    model: "C5 Aircross Shine AT",
    year: 2024,
    price: 3699000,
    mileage: 0,
    fuelType: "Diesel",
    transmission: "8-speed Automatic",
    horsepower: 177,
    acceleration: "9.5s (0-100)",
    topSpeed: "195 kmph",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    description: "French luxury SUV with Advanced Comfort and unique design.",
    features: ["Advanced Comfort Seats", "Progressive Hydraulic Cushions", "Panoramic Sunroof", "Connected Nav"],
    category: "SUV",
    dealers: [
      { name: "Citroen Mumbai", city: "Mumbai", phone: "+91 22 4567 8923" },
      { name: "Citroen Delhi", city: "Delhi", phone: "+91 11 4567 8923" },
      { name: "Citroen Bangalore", city: "Bangalore", phone: "+91 80 4567 8923" }
    ]
  },
  {
    id: "98",
    name: "Citroen Basalt",
    brand: "Citroen",
    model: "Basalt Plus Turbo",
    year: 2024,
    price: 1399000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "6-speed Automatic",
    horsepower: 110,
    acceleration: "11.0s (0-100)",
    topSpeed: "175 kmph",
    image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80",
    description: "India's first coupe SUV with French elegance.",
    features: ["Advanced Comfort", "10-inch Touchscreen", "Wireless Charging", "Automatic Climate"],
    category: "Crossover",
    dealers: [
      { name: "Citroen Mumbai", city: "Mumbai", phone: "+91 22 5678 9034" },
      { name: "Citroen Delhi", city: "Delhi", phone: "+91 11 5678 9034" }
    ]
  },

  // BYD
  {
    id: "99",
    name: "BYD Atto 3",
    brand: "BYD",
    model: "Atto 3 Superior",
    year: 2024,
    price: 3399000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 204,
    acceleration: "7.3s (0-100)",
    topSpeed: "160 kmph",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
    description: "Electric SUV with Blade Battery technology and 521km range.",
    features: ["Blade Battery", "Rotating Display", "NFC Card Key", "V2L"],
    category: "Electric",
    dealers: [
      { name: "BYD Mumbai", city: "Mumbai", phone: "+91 22 6789 0145" },
      { name: "BYD Delhi", city: "Delhi", phone: "+91 11 6789 0145" },
      { name: "BYD Bangalore", city: "Bangalore", phone: "+91 80 6789 0145" }
    ]
  },
  {
    id: "100",
    name: "BYD Seal",
    brand: "BYD",
    model: "Seal Performance AWD",
    year: 2024,
    price: 5399000,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed Automatic",
    horsepower: 530,
    acceleration: "3.8s (0-100)",
    topSpeed: "180 kmph",
    image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
    description: "Premium electric sedan with dual motors and 580km range.",
    features: ["CTB Technology", "Dual Motors AWD", "HUD", "Dynaudio Sound"],
    category: "Electric",
    dealers: [
      { name: "BYD Premium Mumbai", city: "Mumbai", phone: "+91 22 7890 1256" },
      { name: "BYD Premium Delhi", city: "Delhi", phone: "+91 11 7890 1256" }
    ]
  }
];
