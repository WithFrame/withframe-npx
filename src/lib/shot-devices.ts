export type TDeviceColor = {
  id: string;
  name: string;
  hex: string;
  fileSize: number;
  unavailable?: boolean;
};

export type TDevice = {
  id: string;
  name: string;
  physical: {
    width: number;
    height: number;
  };
  colors: TDeviceColor[];
};

type DeviceBounds = {
  width: number;
  height: number;
};

export const supportedDevices: TDevice[] = [
  {
    id: 'iphone.8',
    name: 'iPhone 8',
    physical: {
      width: 750,
      height: 1334,
    },
    colors: [
      {
        id: 'silver',
        name: 'Silver',
        hex: '#E4E4E2',
        fileSize: 346,
      },
      {
        id: 'space_gray',
        name: 'Space Gray',
        hex: '#25282A',
        fileSize: 335,
      },
      {
        id: 'gold',
        name: 'Gold',
        hex: '#F5DDC5',
        fileSize: 430,
      },
    ],
  },
  {
    id: 'iphone.8.plus',
    name: 'iPhone 8 Plus',
    physical: {
      width: 1080,
      height: 1920,
    },
    colors: [
      {
        id: 'silver',
        name: 'Silver',
        hex: '#E4E4E2',
        fileSize: 466,
      },
      {
        id: 'space_gray',
        name: 'Space Gray',
        hex: '#25282A',
        fileSize: 397,
      },
      {
        id: 'gold',
        name: 'Gold',
        hex: '#F5DDC5',
        fileSize: 458,
      },
    ],
  },
  {
    id: 'iphone.13',
    name: 'iPhone 13',
    physical: {
      width: 1170,
      height: 2532,
    },
    colors: [
      {
        id: 'red',
        name: 'Red',
        hex: '#A50011',
        fileSize: 81,
      },
      {
        id: 'starlight',
        name: 'Starlight',
        hex: '#F9F3EE',
        fileSize: 80,
      },
      {
        id: 'midnight',
        name: 'Midnight',
        hex: '#171E27',
        fileSize: 69,
      },
      {
        id: 'blue',
        name: 'Blue',
        hex: '#215E7C',
        fileSize: 84,
      },
      {
        id: 'pink',
        name: 'Pink',
        hex: '#FAE0D8',
        fileSize: 80,
      },
      {
        id: 'green',
        name: 'Green',
        hex: '#364935',
        unavailable: true,
        fileSize: 0,
      },
    ],
  },
  {
    id: 'iphone.13.mini',
    name: 'iPhone 13 Mini',
    physical: {
      width: 1080,
      height: 2340,
    },
    colors: [
      {
        id: 'red',
        name: 'Red',
        hex: '#A50011',
        fileSize: 197,
      },
      {
        id: 'starlight',
        name: 'Starlight',
        hex: '#F9F3EE',
        fileSize: 194,
      },
      {
        id: 'midnight',
        name: 'Midnight',
        hex: '#171E27',
        fileSize: 173,
      },
      {
        id: 'blue',
        name: 'Blue',
        hex: '#215E7C',
        fileSize: 203,
      },
      {
        id: 'pink',
        name: 'Pink',
        hex: '#FAE0D8',
        fileSize: 194,
      },
      {
        id: 'green',
        name: 'Green',
        hex: '#364935',
        unavailable: true,
        fileSize: 0,
      },
    ],
  },
  {
    id: 'iphone.13.pro.max',
    name: 'iPhone 13 Pro Max',
    physical: {
      width: 1284,
      height: 2778,
    },
    colors: [
      {
        id: 'sierra_blue',
        name: 'Sierra Blue',
        hex: '#9BB5CE',
        fileSize: 423,
      },
      {
        id: 'graphite',
        name: 'Graphite',
        hex: '#5C5B57',
        fileSize: 321,
      },
      {
        id: 'gold',
        name: 'Gold',
        hex: '#F9E5C9',
        fileSize: 435,
      },
      {
        id: 'silver',
        name: 'Silver',
        hex: '#F5F5F0',
        fileSize: 435,
      },
      {
        id: 'alpine_green',
        name: 'Alpine Green',
        hex: '#505F4E',
        unavailable: true,
        fileSize: 0,
      },
    ],
  },
  {
    id: 'iphone.14.pro',
    name: 'iPhone 14 Pro',
    physical: {
      width: 1179,
      height: 2556,
    },
    colors: [
      {
        id: 'space_black',
        name: 'Space Black',
        hex: '#4b4845',
        fileSize: 177,
      },
      {
        id: 'silver',
        name: 'Silver',
        hex: '#e2e4e1',
        fileSize: 177,
      },
      {
        id: 'gold',
        name: 'Gold',
        hex: '#d4c9b1',
        fileSize: 177,
      },
      {
        id: 'deep_purple',
        name: 'Deep Purple',
        hex: '#5e5566',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.14.pro.max',
    name: 'iPhone 14 Pro Max',
    physical: {
      width: 1290,
      height: 2796,
    },
    colors: [
      {
        id: 'space_black',
        name: 'Space Black',
        hex: '#4b4845',
        fileSize: 177,
      },
      {
        id: 'silver',
        name: 'Silver',
        hex: '#e2e4e1',
        fileSize: 177,
      },
      {
        id: 'gold',
        name: 'Gold',
        hex: '#d4c9b1',
        fileSize: 177,
      },
      {
        id: 'deep_purple',
        name: 'Deep Purple',
        hex: '#5e5566',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.15.pro',
    name: 'iPhone 15 Pro',
    physical: {
      width: 1179,
      height: 2556,
    },
    colors: [
      {
        id: 'black',
        name: 'Black Titanium',
        hex: '#1b1b1b',
        fileSize: 177,
      },
      {
        id: 'white',
        name: 'White Titanium',
        hex: '#dddddd',
        fileSize: 177,
      },
      {
        id: 'natural',
        name: 'Natural Titanium',
        hex: '#837F7D',
        fileSize: 177,
      },
      {
        id: 'blue',
        name: 'Blue Titanium',
        hex: '#2F4452',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.15.pro.max',
    name: 'iPhone 15 Pro Max',
    physical: {
      width: 1290,
      height: 2796,
    },
    colors: [
      {
        id: 'black',
        name: 'Black Titanium',
        hex: '#1b1b1b',
        fileSize: 177,
      },
      {
        id: 'white',
        name: 'White Titanium',
        hex: '#dddddd',
        fileSize: 177,
      },
      {
        id: 'natural',
        name: 'Natural Titanium',
        hex: '#837F7D',
        fileSize: 177,
      },
      {
        id: 'blue',
        name: 'Blue Titanium',
        hex: '#2F4452',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.16.pro',
    name: 'iPhone 16 Pro',
    physical: {
      width: 1206,
      height: 2622,
    },
    colors: [
      {
        id: 'black',
        name: 'Black Titanium',
        hex: '#3C3C3D',
        fileSize: 177,
      },
      {
        id: 'white',
        name: 'White Titanium',
        hex: '#F2F1ED',
        fileSize: 177,
      },
      {
        id: 'natural',
        name: 'Natural Titanium',
        hex: '#C2BCB2',
        fileSize: 177,
      },
      {
        id: 'desert',
        name: 'Desert Titanium',
        hex: '#BFA48F',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.16.plus',
    name: 'iPhone 16 Plus',
    physical: {
      width: 1290,
      height: 2796,
    },
    colors: [
      {
        id: 'black',
        name: 'Black',
        hex: '#3C4042',
        fileSize: 177,
      },
      {
        id: 'white',
        name: 'White',
        hex: '#FAFAFA',
        fileSize: 177,
      },
      {
        id: 'teal',
        name: 'Teal',
        hex: '#B0D4D2',
        fileSize: 177,
      },
      {
        id: 'ultramarine',
        name: 'Ultramarine',
        hex: '#9AADF6',
        fileSize: 202,
      },
      {
        id: 'pink',
        name: 'Pink',
        hex: '#F2ADDA',
        fileSize: 202,
      },
    ],
  },
  {
    id: 'iphone.16.pro.max',
    name: 'iPhone 16 Pro Max',
    physical: {
      width: 1320,
      height: 2868,
    },
    colors: [
      {
        id: 'black',
        name: 'Black Titanium',
        hex: '#3C3C3D',
        fileSize: 177,
      },
      {
        id: 'white',
        name: 'White Titanium',
        hex: '#F2F1ED',
        fileSize: 177,
      },
      {
        id: 'natural',
        name: 'Natural Titanium',
        hex: '#C2BCB2',
        fileSize: 177,
      },
      {
        id: 'desert',
        name: 'Desert Titanium',
        hex: '#BFA48F',
        fileSize: 202,
      },
    ],
  },
];

export const detectDevice = (bounds: DeviceBounds, deviceId?: string): TDevice => {
  const found = supportedDevices.filter(
    (device) => device.physical.width === bounds.width && device.physical.height === bounds.height,
  );

  if (found.length === 1) {
    return found[0];
  }

  if (found.length > 1) {
    return found.find((device) => device.id === deviceId) ?? found[0];
  }

  throw new Error(
    `We could not detect the device for your screenshot dimensions (${bounds.width}x${bounds.height}). Supported devices: ${supportedDevices
      .map((device) => `"${device.id}"`)
      .join(', ')}.`,
  );
};
