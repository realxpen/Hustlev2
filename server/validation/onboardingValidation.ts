export interface InterestsPayload {
  interests: string[];
}

export interface LocationPayload {
  locationAllowed: boolean;
  coords?: {
    latitude: number;
    longitude: number;
  };
}

export function validateInterests(body: any): { error?: string; value?: InterestsPayload } {
  if (!body) {
    return { error: 'Request body is required' };
  }

  const { interests } = body;

  if (interests === undefined) {
    return { error: 'interests property is missing' };
  }

  if (!Array.isArray(interests)) {
    return { error: 'interests must be an array of strings' };
  }

  // Validate all elements are strings
  const allStrings = interests.every((item: any) => typeof item === 'string');
  if (!allStrings) {
    return { error: 'All interests must be text values' };
  }

  return { value: { interests } };
}

export function validateLocation(body: any): { error?: string; value?: LocationPayload } {
  if (!body) {
    return { error: 'Request body is required' };
  }

  const { locationAllowed, coords } = body;

  if (locationAllowed === undefined) {
    return { error: 'locationAllowed property is missing' };
  }

  if (typeof locationAllowed !== 'boolean') {
    return { error: 'locationAllowed must be a boolean' };
  }

  if (locationAllowed) {
    if (!coords) {
      return { error: 'coords object is required when locationAllowed is true' };
    }
    const { latitude, longitude } = coords;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { error: 'coords must contain numeric latitude and longitude values' };
    }
  }

  return { value: { locationAllowed, coords } };
}
