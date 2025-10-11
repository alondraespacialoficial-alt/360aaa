import {
  CakeIcon,
  CameraIcon,
  MusicalNoteIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  FilmIcon,
  TruckIcon,
  HomeModernIcon,
  StarIcon,
  HeartIcon,
  GiftIcon,
  UserIcon,
  ScissorsIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/solid';

// Mapeo de categorías a íconos
export const categoryIcons: Record<string, JSX.Element> = {
  'autos': <TruckIcon className="h-10 w-10 text-blue-500" />,
  'banquetes': <CakeIcon className="h-10 w-10 text-pink-500" />,
  'comida': <CakeIcon className="h-10 w-10 text-pink-500" />,
  'decoración': <SparklesIcon className="h-10 w-10 text-yellow-500" />,
  'entretenimiento': <MusicalNoteIcon className="h-10 w-10 text-purple-500" />,
  'flores': <SparklesIcon className="h-10 w-10 text-green-500" />,
  'fotografía': <CameraIcon className="h-10 w-10 text-gray-500" />,
  'video': <FilmIcon className="h-10 w-10 text-gray-700" />,
  'lugares': <BuildingStorefrontIcon className="h-10 w-10 text-indigo-500" />,
  'maquillaje': <FaceSmileIcon className="h-10 w-10 text-pink-400" />,
  'mobiliario': <HomeModernIcon className="h-10 w-10 text-gray-400" />,
  'música': <MusicalNoteIcon className="h-10 w-10 text-purple-500" />,
  'organizadores': <UsersIcon className="h-10 w-10 text-indigo-400" />,
  'peluquería': <ScissorsIcon className="h-10 w-10 text-pink-400" />,
  'personal': <UserIcon className="h-10 w-10 text-gray-600" />,
  'repostería': <CakeIcon className="h-10 w-10 text-pink-500" />,
  'salones': <BuildingStorefrontIcon className="h-10 w-10 text-indigo-500" />,
  'transporte': <TruckIcon className="h-10 w-10 text-blue-400" />,
  'vestuario': <HeartIcon className="h-10 w-10 text-red-400" />,
  'regalo': <GiftIcon className="h-10 w-10 text-yellow-400" />,
};

export default categoryIcons;
