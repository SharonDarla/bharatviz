/**
 * City Map Configuration
 *
 * Provides city ward boundary data from the harmonized manifest.
 * Each city may have multiple datasets (e.g., Bangalore has 2022 wards + old wards).
 * GeoJSON files are served from GitHub Gists with local paths as fallback.
 */

import cityGistMapping from './city-gist-mapping.json';

const gistUrls = cityGistMapping as Record<string, string>;

export interface CityDataset {
  id: string;
  displayName: string;
  state: string;
  type: 'wards' | 'zones' | 'boundary' | 'other';
  source: string;
  label: string;
  featureCount: number;
  geojsonPath: string;
}

export interface CityEntry {
  displayName: string;
  state: string;
  datasets: CityDataset[];
}

const CITY_DATASETS: CityDataset[] = [
  { id: 'ahmedabad', displayName: 'Ahmedabad', state: 'Gujarat', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 48, geojsonPath: '/cities/ahmedabad.geojson' },
  { id: 'bangalore', displayName: 'Bangalore', state: 'Karnataka', type: 'wards', source: 'DataMeet', label: 'BBMP Wards (2022)', featureCount: 243, geojsonPath: '/cities/bangalore.geojson' },
  { id: 'bangalore_old_wards', displayName: 'Bangalore', state: 'Karnataka', type: 'wards', source: 'DataMeet', label: 'Old Wards (pre-2022)', featureCount: 198, geojsonPath: '/cities/bangalore_old_wards.geojson' },
  { id: 'bhopal', displayName: 'Bhopal', state: 'Madhya Pradesh', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 86, geojsonPath: '/cities/bhopal.geojson' },
  { id: 'bhubaneswar', displayName: 'Bhubaneswar', state: 'Odisha', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 67, geojsonPath: '/cities/bhubaneswar.geojson' },
  { id: 'bodh_gaya', displayName: 'Bodh Gaya', state: 'Bihar', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 19, geojsonPath: '/cities/bodh_gaya.geojson' },
  { id: 'chandigarh', displayName: 'Chandigarh', state: 'Chandigarh', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 28, geojsonPath: '/cities/chandigarh.geojson' },
  { id: 'chennai', displayName: 'Chennai', state: 'Tamil Nadu', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 201, geojsonPath: '/cities/chennai.geojson' },
  { id: 'chennai_zones', displayName: 'Chennai', state: 'Tamil Nadu', type: 'zones', source: 'DataMeet', label: 'Zones', featureCount: 16, geojsonPath: '/cities/chennai_zones.geojson' },
  { id: 'coimbatore', displayName: 'Coimbatore', state: 'Tamil Nadu', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 100, geojsonPath: '/cities/coimbatore.geojson' },
  { id: 'delhi', displayName: 'Delhi', state: 'Delhi', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 290, geojsonPath: '/cities/delhi.geojson' },
  { id: 'delhi_boundary', displayName: 'Delhi', state: 'Delhi', type: 'boundary', source: 'DataMeet', label: 'Boundary', featureCount: 1, geojsonPath: '/cities/delhi_boundary.geojson' },
  { id: 'faridabad', displayName: 'Faridabad', state: 'Haryana', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 40, geojsonPath: '/cities/faridabad.geojson' },
  { id: 'hyderabad', displayName: 'Hyderabad', state: 'Telangana', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 145, geojsonPath: '/cities/hyderabad.geojson' },
  { id: 'indore', displayName: 'Indore', state: 'Madhya Pradesh', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 85, geojsonPath: '/cities/indore.geojson' },
  { id: 'jaipur', displayName: 'Jaipur', state: 'Rajasthan', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 77, geojsonPath: '/cities/jaipur.geojson' },
  { id: 'kanpur', displayName: 'Kanpur', state: 'Uttar Pradesh', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 58, geojsonPath: '/cities/kanpur.geojson' },
  { id: 'katihar', displayName: 'Katihar', state: 'Bihar', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 45, geojsonPath: '/cities/katihar.geojson' },
  { id: 'kishangarh', displayName: 'Kishangarh', state: 'Rajasthan', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 45, geojsonPath: '/cities/kishangarh.geojson' },
  { id: 'kochi', displayName: 'Kochi', state: 'Kerala', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 77, geojsonPath: '/cities/kochi.geojson' },
  { id: 'kolkata', displayName: 'Kolkata', state: 'West Bengal', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 141, geojsonPath: '/cities/kolkata.geojson' },
  { id: 'lucknow', displayName: 'Lucknow', state: 'Uttar Pradesh', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 112, geojsonPath: '/cities/lucknow.geojson' },
  { id: 'mira_bhayandar', displayName: 'Mira-Bhayandar', state: 'Maharashtra', type: 'boundary', source: 'DataMeet', label: 'Municipal Boundary', featureCount: 1, geojsonPath: '/cities/mira_bhayandar.geojson' },
  { id: 'mumbai', displayName: 'Mumbai', state: 'Maharashtra', type: 'wards', source: 'DataMeet', label: 'Administrative Wards (A-T)', featureCount: 24, geojsonPath: '/cities/mumbai.geojson' },
  { id: 'mumbai_v2', displayName: 'Mumbai', state: 'Maharashtra', type: 'wards', source: 'MCGM/MPCB', label: 'Wards + Localities', featureCount: 227, geojsonPath: '/cities/mumbai_v2.geojson' },
  { id: 'nagpur', displayName: 'Nagpur', state: 'Maharashtra', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 42, geojsonPath: '/cities/nagpur.geojson' },
  { id: 'nmmc', displayName: 'Navi Mumbai', state: 'Maharashtra', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 111, geojsonPath: '/cities/nmmc.geojson' },
  { id: 'patna', displayName: 'Patna', state: 'Bihar', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 628, geojsonPath: '/cities/patna.geojson' },
  { id: 'pcmc', displayName: 'Pimpri-Chinchwad', state: 'Maharashtra', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 66, geojsonPath: '/cities/pcmc.geojson' },
  { id: 'pune', displayName: 'Pune', state: 'Maharashtra', type: 'wards', source: 'DataMeet', label: 'Electoral Wards (2022)', featureCount: 58, geojsonPath: '/cities/pune.geojson' },
  { id: 'purnia', displayName: 'Purnia', state: 'Bihar', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 43, geojsonPath: '/cities/purnia.geojson' },
  { id: 'surat', displayName: 'Surat', state: 'Gujarat', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 30, geojsonPath: '/cities/surat.geojson' },
  { id: 'thane', displayName: 'Thane', state: 'Maharashtra', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 33, geojsonPath: '/cities/thane.geojson' },
  { id: 'vadodara', displayName: 'Vadodara', state: 'Gujarat', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 12, geojsonPath: '/cities/vadodara.geojson' },
  { id: 'vijayawada', displayName: 'Vijayawada', state: 'Andhra Pradesh', type: 'wards', source: 'DataMeet', label: 'Wards', featureCount: 77, geojsonPath: '/cities/vijayawada.geojson' },
  { id: 'visakhapatnam', displayName: 'Visakhapatnam', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/AMRUT', label: 'Wards', featureCount: 91, geojsonPath: '/cities/visakhapatnam.geojson' },

  // --- SBM/WB_AMRUT cities ---
  { id: 'agra', displayName: 'Agra', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 100, geojsonPath: '/cities/agra.geojson' },
  { id: 'ajmer', displayName: 'Ajmer', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 81, geojsonPath: '/cities/ajmer.geojson' },
  { id: 'alappuzha', displayName: 'Alappuzha', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 52, geojsonPath: '/cities/alappuzha.geojson' },
  { id: 'aligarh', displayName: 'Aligarh', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 80, geojsonPath: '/cities/aligarh.geojson' },
  { id: 'alwar', displayName: 'Alwar', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 79, geojsonPath: '/cities/alwar.geojson' },
  { id: 'ambala', displayName: 'Ambala', state: 'Haryana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 59, geojsonPath: '/cities/ambala.geojson' },
  { id: 'ambarnath', displayName: 'Ambarnath', state: 'Maharashtra', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/ambarnath.geojson' },
  { id: 'amritsar', displayName: 'Amritsar', state: 'Punjab', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 85, geojsonPath: '/cities/amritsar.geojson' },
  { id: 'aurangabad', displayName: 'Aurangabad', state: 'Maharashtra', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 170, geojsonPath: '/cities/aurangabad.geojson' },
  { id: 'ayodhya', displayName: 'Ayodhya', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/ayodhya.geojson' },
  { id: 'bareilly', displayName: 'Bareilly', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 106, geojsonPath: '/cities/bareilly.geojson' },
  { id: 'belagavi', displayName: 'Belagavi', state: 'Karnataka', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 69, geojsonPath: '/cities/belagavi.geojson' },
  { id: 'bharatpur', displayName: 'Bharatpur', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 65, geojsonPath: '/cities/bharatpur.geojson' },
  { id: 'bhavnagar', displayName: 'Bhavnagar', state: 'Gujarat', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 13, geojsonPath: '/cities/bhavnagar.geojson' },
  { id: 'bhilai', displayName: 'Bhilai', state: 'Chhattisgarh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 69, geojsonPath: '/cities/bhilai.geojson' },
  { id: 'bhilwara', displayName: 'Bhilwara', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 70, geojsonPath: '/cities/bhilwara.geojson' },
  { id: 'bidhannagar', displayName: 'Bidhannagar', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 42, geojsonPath: '/cities/bidhannagar.geojson' },
  { id: 'bikaner', displayName: 'Bikaner', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 80, geojsonPath: '/cities/bikaner.geojson' },
  { id: 'bilaspur_cg', displayName: 'Bilaspur', state: 'Chhattisgarh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 91, geojsonPath: '/cities/bilaspur_cg.geojson' },
  { id: 'burdwan', displayName: 'Burdwan', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 35, geojsonPath: '/cities/burdwan.geojson' },
  { id: 'cuttack', displayName: 'Cuttack', state: 'Odisha', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 59, geojsonPath: '/cities/cuttack.geojson' },
  { id: 'dehradun', displayName: 'Dehradun', state: 'Uttarakhand', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 108, geojsonPath: '/cities/dehradun.geojson' },
  { id: 'dhanbad', displayName: 'Dhanbad', state: 'Jharkhand', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/dhanbad.geojson' },
  { id: 'durg', displayName: 'Durg', state: 'Chhattisgarh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 278, geojsonPath: '/cities/durg.geojson' },
  { id: 'durgapur', displayName: 'Durgapur', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 49, geojsonPath: '/cities/durgapur.geojson' },
  { id: 'english_bazar', displayName: 'English Bazar', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 29, geojsonPath: '/cities/english_bazar.geojson' },
  { id: 'erode', displayName: 'Erode', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/erode.geojson' },
  { id: 'firozabad', displayName: 'Firozabad', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 70, geojsonPath: '/cities/firozabad.geojson' },
  { id: 'gandhinagar', displayName: 'Gandhinagar', state: 'Gujarat', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 11, geojsonPath: '/cities/gandhinagar.geojson' },
  { id: 'ganganagar', displayName: 'Ganganagar', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 65, geojsonPath: '/cities/ganganagar.geojson' },
  { id: 'ghaziabad', displayName: 'Ghaziabad', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 94, geojsonPath: '/cities/ghaziabad.geojson' },
  { id: 'gorakhpur', displayName: 'Gorakhpur', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 92, geojsonPath: '/cities/gorakhpur.geojson' },
  { id: 'guntur', displayName: 'Guntur', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 57, geojsonPath: '/cities/guntur.geojson' },
  { id: 'gwalior', displayName: 'Gwalior', state: 'Madhya Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 66, geojsonPath: '/cities/gwalior.geojson' },
  { id: 'haldia', displayName: 'Haldia', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 58, geojsonPath: '/cities/haldia.geojson' },
  { id: 'haldwani', displayName: 'Haldwani', state: 'Uttarakhand', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/haldwani.geojson' },
  { id: 'hisar', displayName: 'Hisar', state: 'Haryana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 20, geojsonPath: '/cities/hisar.geojson' },
  { id: 'hubli_dharwad', displayName: 'Hubli-Dharwad', state: 'Karnataka', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 67, geojsonPath: '/cities/hubli_dharwad.geojson' },
  { id: 'jabalpur', displayName: 'Jabalpur', state: 'Madhya Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 86, geojsonPath: '/cities/jabalpur.geojson' },
  { id: 'jalandhar', displayName: 'Jalandhar', state: 'Punjab', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 87, geojsonPath: '/cities/jalandhar.geojson' },
  { id: 'jammu', displayName: 'Jammu', state: 'Jammu & Kashmir', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 75, geojsonPath: '/cities/jammu.geojson' },
  { id: 'jamnagar', displayName: 'Jamnagar', state: 'Gujarat', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 16, geojsonPath: '/cities/jamnagar.geojson' },
  { id: 'jamshedpur', displayName: 'Jamshedpur', state: 'Jharkhand', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 10, geojsonPath: '/cities/jamshedpur.geojson' },
  { id: 'jhansi', displayName: 'Jhansi', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 69, geojsonPath: '/cities/jhansi.geojson' },
  { id: 'jodhpur_north', displayName: 'Jodhpur', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards (North)', featureCount: 80, geojsonPath: '/cities/jodhpur_north.geojson' },
  { id: 'jodhpur_south', displayName: 'Jodhpur', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards (South)', featureCount: 80, geojsonPath: '/cities/jodhpur_south.geojson' },
  { id: 'junagadh', displayName: 'Junagadh', state: 'Gujarat', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 24, geojsonPath: '/cities/junagadh.geojson' },
  { id: 'kakinada', displayName: 'Kakinada', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 50, geojsonPath: '/cities/kakinada.geojson' },
  { id: 'kalyan_dombivali', displayName: 'Kalyan-Dombivali', state: 'Maharashtra', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 122, geojsonPath: '/cities/kalyan_dombivali.geojson' },
  { id: 'kannur', displayName: 'Kannur', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/kannur.geojson' },
  { id: 'karnal', displayName: 'Karnal', state: 'Haryana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 20, geojsonPath: '/cities/karnal.geojson' },
  { id: 'khammam', displayName: 'Khammam', state: 'Telangana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/khammam.geojson' },
  { id: 'kharagpur', displayName: 'Kharagpur', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 35, geojsonPath: '/cities/kharagpur.geojson' },
  { id: 'kollam', displayName: 'Kollam', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/kollam.geojson' },
  { id: 'korba', displayName: 'Korba', state: 'Chhattisgarh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 67, geojsonPath: '/cities/korba.geojson' },
  { id: 'kota_north', displayName: 'Kota', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards (North)', featureCount: 70, geojsonPath: '/cities/kota_north.geojson' },
  { id: 'kota_south', displayName: 'Kota', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards (South)', featureCount: 80, geojsonPath: '/cities/kota_south.geojson' },
  { id: 'kozhikode', displayName: 'Kozhikode', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 2, geojsonPath: '/cities/kozhikode.geojson' },
  { id: 'kurnool', displayName: 'Kurnool', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 76, geojsonPath: '/cities/kurnool.geojson' },
  { id: 'loni', displayName: 'Loni', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/loni.geojson' },
  { id: 'ludhiana', displayName: 'Ludhiana', state: 'Punjab', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 95, geojsonPath: '/cities/ludhiana.geojson' },
  { id: 'madurai', displayName: 'Madurai', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 17, geojsonPath: '/cities/madurai.geojson' },
  { id: 'mangalore', displayName: 'Mangalore', state: 'Karnataka', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 540, geojsonPath: '/cities/mangalore.geojson' },
  { id: 'mathura', displayName: 'Mathura', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 70, geojsonPath: '/cities/mathura.geojson' },
  { id: 'meerut', displayName: 'Meerut', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 90, geojsonPath: '/cities/meerut.geojson' },
  { id: 'moradabad', displayName: 'Moradabad', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 70, geojsonPath: '/cities/moradabad.geojson' },
  { id: 'mysuru', displayName: 'Mysuru', state: 'Karnataka', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 65, geojsonPath: '/cities/mysuru.geojson' },
  { id: 'nagercoil', displayName: 'Nagercoil', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 52, geojsonPath: '/cities/nagercoil.geojson' },
  { id: 'nellore', displayName: 'Nellore', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 54, geojsonPath: '/cities/nellore.geojson' },
  { id: 'nizamabad', displayName: 'Nizamabad', state: 'Telangana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/nizamabad.geojson' },
  { id: 'palakkad', displayName: 'Palakkad', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 52, geojsonPath: '/cities/palakkad.geojson' },
  { id: 'panipat', displayName: 'Panipat', state: 'Haryana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 26, geojsonPath: '/cities/panipat.geojson' },
  { id: 'patiala', displayName: 'Patiala', state: 'Punjab', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/patiala.geojson' },
  { id: 'prayagraj', displayName: 'Prayagraj', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 100, geojsonPath: '/cities/prayagraj.geojson' },
  { id: 'raiganj', displayName: 'Raiganj', state: 'West Bengal', type: 'wards', source: 'WB_AMRUT/ramSeraph', label: 'Wards', featureCount: 27, geojsonPath: '/cities/raiganj.geojson' },
  { id: 'raipur', displayName: 'Raipur', state: 'Chhattisgarh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 70, geojsonPath: '/cities/raipur.geojson' },
  { id: 'rajahmundry', displayName: 'Rajahmundry', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 50, geojsonPath: '/cities/rajahmundry.geojson' },
  { id: 'rajkot', displayName: 'Rajkot', state: 'Gujarat', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 18, geojsonPath: '/cities/rajkot.geojson' },
  { id: 'ranchi', displayName: 'Ranchi', state: 'Jharkhand', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 53, geojsonPath: '/cities/ranchi.geojson' },
  { id: 'rohtak', displayName: 'Rohtak', state: 'Haryana', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 25, geojsonPath: '/cities/rohtak.geojson' },
  { id: 'rourkela', displayName: 'Rourkela', state: 'Odisha', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 40, geojsonPath: '/cities/rourkela.geojson' },
  { id: 'salem', displayName: 'Salem', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 73, geojsonPath: '/cities/salem.geojson' },
  { id: 'sambalpur', displayName: 'Sambalpur', state: 'Odisha', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 41, geojsonPath: '/cities/sambalpur.geojson' },
  { id: 'shahjahanpur', displayName: 'Shahjahanpur', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 73, geojsonPath: '/cities/shahjahanpur.geojson' },
  { id: 'shimla', displayName: 'Shimla', state: 'Himachal Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 34, geojsonPath: '/cities/shimla.geojson' },
  { id: 'sikar', displayName: 'Sikar', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 90, geojsonPath: '/cities/sikar.geojson' },
  { id: 'thiruvananthapuram', displayName: 'Thiruvananthapuram', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 100, geojsonPath: '/cities/thiruvananthapuram.geojson' },
  { id: 'thoothukudi', displayName: 'Thoothukudi', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 60, geojsonPath: '/cities/thoothukudi.geojson' },
  { id: 'thrissur', displayName: 'Thrissur', state: 'Kerala', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 55, geojsonPath: '/cities/thrissur.geojson' },
  { id: 'tirupati', displayName: 'Tirupati', state: 'Andhra Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 50, geojsonPath: '/cities/tirupati.geojson' },
  { id: 'udaipur', displayName: 'Udaipur', state: 'Rajasthan', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 105, geojsonPath: '/cities/udaipur.geojson' },
  { id: 'ujjain', displayName: 'Ujjain', state: 'Madhya Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 54, geojsonPath: '/cities/ujjain.geojson' },
  { id: 'varanasi', displayName: 'Varanasi', state: 'Uttar Pradesh', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 90, geojsonPath: '/cities/varanasi.geojson' },
  { id: 'vasai_virar', displayName: 'Vasai-Virar', state: 'Maharashtra', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 115, geojsonPath: '/cities/vasai_virar.geojson' },
  { id: 'vellore', displayName: 'Vellore', state: 'Tamil Nadu', type: 'wards', source: 'SBM/ramSeraph', label: 'Wards', featureCount: 25, geojsonPath: '/cities/vellore.geojson' },
].map(ds => ({
  ...ds,
  geojsonPath: gistUrls[ds.id] || ds.geojsonPath,
}));

/**
 * Get all cities grouped by display name, each with their available datasets.
 * Cities are sorted alphabetically. Multi-dataset cities show all variants.
 */
export function getCityList(): CityEntry[] {
  const grouped = new Map<string, CityEntry>();

  for (const ds of CITY_DATASETS) {
    const key = ds.displayName;
    if (!grouped.has(key)) {
      grouped.set(key, { displayName: ds.displayName, state: ds.state, datasets: [] });
    }
    grouped.get(key)!.datasets.push(ds);
  }

  return Array.from(grouped.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Get a specific dataset by its id.
 */
export function getCityDataset(datasetId: string): CityDataset | undefined {
  return CITY_DATASETS.find(d => d.id === datasetId);
}

/**
 * Get all datasets for a given city display name.
 */
export function getCityDatasets(displayName: string): CityDataset[] {
  return CITY_DATASETS.filter(d => d.displayName === displayName);
}

/**
 * Default city and dataset to show on load.
 */
export const DEFAULT_CITY = 'Mumbai';
export const DEFAULT_CITY_DATASET = 'mumbai';
