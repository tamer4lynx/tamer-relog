import font_0 from './fonts/MaterialIcons-Regular.ttf'
import font_1 from './fonts/fa-brands-400.ttf'
import font_2 from './fonts/fa-regular-400.ttf'
import font_3 from './fonts/fa-solid-900.ttf'

export const TAMER_ICONS_FONT_MANIFEST: Record<string, Array<{ fontFamily: string; src: string }>> = {
  'https://fonts.googleapis.com/css2?family=Material+Icons&display=block': [
    { fontFamily: 'Material Icons', src: font_0 },
  ],
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css': [
    { fontFamily: 'Font Awesome 6 Brands', src: font_1 },
    { fontFamily: 'Font Awesome 6 Free', src: font_2 },
    { fontFamily: 'Font Awesome 6 Free', src: font_3 },
    { fontFamily: 'Font Awesome 5 Brands', src: font_1 },
    { fontFamily: 'Font Awesome 5 Free', src: font_3 },
    { fontFamily: 'Font Awesome 5 Free', src: font_2 },
    { fontFamily: 'FontAwesome', src: font_3 },
    { fontFamily: 'FontAwesome', src: font_1 },
    { fontFamily: 'FontAwesome', src: font_2 },
  ],
}
