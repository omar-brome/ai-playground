export type Product = {
  id: string
  name: string
  scent: string
  price: number
  weight: string
  burnTime: string
  image: string
}

export const products: Product[] = [
  {
    id: 'c1',
    name: 'Noir Absolu',
    scent: 'Oud & Black Amber',
    price: 42,
    weight: '200g',
    burnTime: '45hrs',
    image:
      'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=600',
  },
  {
    id: 'c2',
    name: "Côte d'Azur",
    scent: 'Sea Salt & Driftwood',
    price: 38,
    weight: '180g',
    burnTime: '40hrs',
    image:
      'https://images.unsplash.com/photo-1603905766604-4b7d8e3a1c6e?w=600',
  },
  {
    id: 'c3',
    name: 'Jardin Secret',
    scent: 'Tuberose & Jasmine',
    price: 45,
    weight: '220g',
    burnTime: '50hrs',
    image:
      'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=600',
  },
  {
    id: 'c4',
    name: 'Tabac Doré',
    scent: 'Tobacco & Vanilla Bean',
    price: 50,
    weight: '250g',
    burnTime: '55hrs',
    image:
      'https://images.unsplash.com/photo-1629198735660-e39ea93f5398?w=600',
  },
  {
    id: 'c5',
    name: 'Brume Matinale',
    scent: 'White Tea & Eucalyptus',
    price: 36,
    weight: '170g',
    burnTime: '38hrs',
    image:
      'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600',
  },
  {
    id: 'c6',
    name: 'Santal Mystique',
    scent: 'Sandalwood & Cardamom',
    price: 48,
    weight: '230g',
    burnTime: '52hrs',
    image:
      'https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600',
  },
  {
    id: 'c7',
    name: 'Rose Cendrée',
    scent: 'Burnt Rose & Musk',
    price: 44,
    weight: '210g',
    burnTime: '48hrs',
    image:
      'https://images.unsplash.com/photo-1543353071-087092ec393a?w=600',
  },
  {
    id: 'c8',
    name: 'Forêt Profonde',
    scent: 'Cedar & Pine Resin',
    price: 40,
    weight: '195g',
    burnTime: '43hrs',
    image:
      'https://images.unsplash.com/photo-1570823341299-77967d17a798?w=600',
  },
]
