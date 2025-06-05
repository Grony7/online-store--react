export interface IProfile {
  id: number;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;  // Полный URL аватара
  avatarThumbnail?: string; // URL миниатюры аватара
  birthdate?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
}
