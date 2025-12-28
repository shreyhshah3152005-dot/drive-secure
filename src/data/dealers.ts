export interface Dealer {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  specialization: string[];
  image: string;
}

export const dealers: Dealer[] = [
  // Mumbai
  {
    id: "d1",
    name: "Big Boy Toyz Mumbai",
    city: "Mumbai",
    address: "Andheri West, Mumbai, Maharashtra",
    phone: "+91 22 4567 8901",
    email: "contact@BigBoyToyz.in",
    rating: 4.8,
    specialization: ["Luxury", "Sports Cars"],
    image: "https://www.bigboytoyz.com/images/showroom-page/mumbai-showroom-img-1.webp"
  },
  {
    id: "d2",
    name: "Elite Motors Mumbai",
    city: "Mumbai",
    address: "Worli, Mumbai, Maharashtra",
    phone: "+91 22 5678 9012",
    email: "sales@elitemotorsmumbai.in",
    rating: 4.6,
    specialization: ["Premium SUVs", "Sedans"],
    image: "https://www.architectandinteriorsindia.com/cloud/2023/05/19/SAN_1101-1024x610.jpg"
  },
  // Delhi
  {
    id: "d3",
    name: "Capital Cars Hub",
    city: "Delhi",
    address: "Connaught Place, New Delhi",
    phone: "+91 11 4567 8901",
    email: "info@capitalcarshub.in",
    rating: 4.7,
    specialization: ["Luxury", "Electric Vehicles"],
    image: "https://www.architectandinteriorsindia.com/cloud/2023/05/19/SAN_1068-1024x726.jpg",
  },
  {
    id: "d4",
    name: "Delhi Premium Autos",
    city: "Delhi",
    address: "Rajouri Garden, New Delhi",
    phone: "+91 11 5678 9012",
    email: "contact@delhipremiumautos.in",
    rating: 4.5,
    specialization: ["Sports Cars", "Convertibles"],
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400"
  },
  // Bangalore
  {
    id: "d5",
    name: "Silicon Valley Motors",
    city: "Bangalore",
    address: "Koramangala, Bangalore, Karnataka",
    phone: "+91 80 4567 8901",
    email: "sales@siliconvalleymotors.in",
    rating: 4.9,
    specialization: ["Electric Vehicles", "Tech-Enhanced Cars"],
    image: "https://cdn.i-scmp.com/sites/default/files/styles/1200x800/public/d8/images/2019/11/01/1a_bmw_wanchaishowroom_finedata_1.jpg?itok=vi_G10jb"
  },
  {
    id: "d6",
    name: "Garden City Cars",
    city: "Bangalore",
    address: "Indiranagar, Bangalore, Karnataka",
    phone: "+91 80 5678 9012",
    email: "info@gardencitycars.in",
    rating: 4.6,
    specialization: ["Luxury SUVs", "Premium Sedans"],
    image: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400"
  },
  // Chennai
  {
    id: "d7",
    name: "Marina Motors",
    city: "Chennai",
    address: "Anna Nagar, Chennai, Tamil Nadu",
    phone: "+91 44 4567 8901",
    email: "contact@marinamotors.in",
    rating: 4.7,
    specialization: ["Japanese Cars", "Sedans"],
    image: "https://images.squarespace-cdn.com/content/v1/5ed687cf9ebd14034857d963/1605283562912-NH28O40SS1ZM5756FYSE/APG03447.jpg"
  },
  // Hyderabad
  {
    id: "d8",
    name: "Deccan Auto Gallery",
    city: "Hyderabad",
    address: "Banjara Hills, Hyderabad, Telangana",
    phone: "+91 40 4567 8901",
    email: "sales@deccanautogallery.in",
    rating: 4.8,
    specialization: ["Luxury", "Sports Cars"],
    image: "https://www.architectandinteriorsindia.com/cloud/2023/05/19/SAN_1101-1024x610.jpg"
  },
  {
    id: "d9",
    name: "Pearl City Motors",
    city: "Hyderabad",
    address: "Jubilee Hills, Hyderabad, Telangana",
    phone: "+91 40 5678 9012",
    email: "info@pearlcitymotors.in",
    rating: 4.5,
    specialization: ["Premium SUVs", "Electric Vehicles"],
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"
  },
  // Pune
  {
    id: "d10",
    name: "Oxford Car Gallery",
    city: "Pune",
    address: "Koregaon Park, Pune, Maharashtra",
    phone: "+91 20 4567 8901",
    email: "contact@oxfordcargallery.in",
    rating: 4.6,
    specialization: ["European Cars", "Luxury Sedans"],
    image: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400"
  },
  // Kolkata
  {
    id: "d11",
    name: "Heritage Motors Kolkata",
    city: "Kolkata",
    address: "Park Street, Kolkata, West Bengal",
    phone: "+91 33 4567 8901",
    email: "sales@heritagemotorskolkata.in",
    rating: 4.5,
    specialization: ["Classic Cars", "Luxury"],
    image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400"
  },
  // Ahmedabad
  {
    id: "d12",
    name: "Gujarat Premium Cars",
    city: "Ahmedabad",
    address: "Satellite, Ahmedabad, Gujarat",
    phone: "+91 79 4567 8901",
    email: "info@gujaratpremiumcars.in",
    rating: 4.5,
    specialization: ["Family Cars", "SUVs"],
    image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400"
  },
  // Jaipur
  {
    id: "d13",
    name: "Pink City Autos",
    city: "Jaipur",
    address: "C-Scheme, Jaipur, Rajasthan",
    phone: "+91 141 456 7890",
    email: "contact@pinkcityautos.in",
    rating: 4.6,
    specialization: ["Luxury SUVs", "Premium Sedans"],
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"
  },
  // Lucknow
  {
    id: "d14",
    name: "Awadh Motors",
    city: "Lucknow",
    address: "Gomti Nagar, Lucknow, Uttar Pradesh",
    phone: "+91 522 456 7890",
    email: "sales@awadhmotors.in",
    rating: 4.4,
    specialization: ["Sedans", "Family Cars"],
    image: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400"
  },
  // Chandigarh
  {
    id: "d15",
    name: "City Beautiful Cars",
    city: "Chandigarh",
    address: "Sector 17, Chandigarh",
    phone: "+91 172 456 7890",
    email: "info@citybeautifulcars.in",
    rating: 4.7,
    specialization: ["Sports Cars", "Luxury"],
    image: "https://www.wheelsofworld.in/_next/static/media/showroom-back.f213b363.jpg"
  }
];