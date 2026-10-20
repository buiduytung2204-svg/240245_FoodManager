import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f6f2'
  },
  content: {
    padding: 18,
    gap: 12,
    paddingBottom: 40
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0e6dc'
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#193d2d'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#193d2d'
  },
  text: {
    fontSize: 15,
    color: '#263c31'
  },
  muted: {
    fontSize: 13,
    color: '#5c6c62'
  },
  input: {
    borderWidth: 1,
    borderColor: '#bac8bf',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#193d2d',
    fontSize: 16
  },
  button: {
    backgroundColor: '#246447',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  danger: {
    backgroundColor: '#a93434'
  },
  chip: {
    borderWidth: 1,
    borderColor: '#b9c9bd',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#fff'
  },
  selected: {
    backgroundColor: '#d3ebd6',
    borderColor: '#246447'
  },
  error: {
    color: '#a12828'
  },
  image: {
    height: 190,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#e3e9e1'
  }
});
