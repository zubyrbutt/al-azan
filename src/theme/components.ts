import type {Theme} from 'native-base';

export const components: Theme['components'] | (Record<string, any> & {}) = {
  Text: {
    baseStyle: {
      color: 'dark.50',
      _dark: {
        color: 'lightText',
      },
    },
  },
  FormControlLabel: {
    baseStyle: {
      _text: {
        _dark: {
          color: 'light.50',
        },
        color: 'dark.100',
      },
      marginTop: 0.5,
      marginBottom: 0.5,
    },
  },
  FormControlHelperText: {
    baseStyle: {
      _text: {
        color: 'muted.700',
        _dark: {
          color: 'light.300',
        },
      },
      marginTop: 0.5,
      marginBottom: 0.5,
    },
  },
};
