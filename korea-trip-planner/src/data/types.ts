export type CityId = string;

export type PlaceCategory =
  | 'sight'      // достопримечательность
  | 'palace'     // дворцы, храмы, история
  | 'museum'
  | 'nature'     // парки, горы, пляжи
  | 'food'       // рынки, рестораны, улицы еды
  | 'shopping'
  | 'nightlife'
  | 'viewpoint'  // смотровые
  | 'activity';  // развлечения, тематические парки

export interface City {
  id: CityId;           // 'seoul'
  nameRu: string;       // 'Сеул'
  nameEn: string;       // 'Seoul'
  nameKo: string;       // '서울'
  region: string;       // на русском: 'Столичный регион'
  description: string;  // 1–2 предложения на русском
  lat: number;
  lng: number;
}

export interface Place {
  id: string;            // 'seoul-gyeongbokgung'
  cityId: CityId;
  category: PlaceCategory;
  nameRu: string;
  nameEn: string;
  nameKo: string;
  aliases?: string[];    // альтернативные написания (ru/en), напр. 'Кёнбоккун', 'Gyeongbok Palace'
  addressRu?: string;
  addressEn: string;     // официальный адрес на английском
  addressKo: string;     // адрес на корейском (для Naver/Kakao)
  lat: number;
  lng: number;
  description: string;   // 1–2 предложения на русском
  website?: string;      // официальный сайт, только если уверен
  tags?: string[];       // на русском
}
