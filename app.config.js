module.exports = ({ config }) => {
  const clientIds = [
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  ].filter(Boolean);

  const googleSchemes = clientIds.map((clientId) => {
    const clientIdSuffix = ".apps.googleusercontent.com";
    if (!clientId.endsWith(clientIdSuffix)) {
      throw new Error("Google native client IDs must end with .apps.googleusercontent.com");
    }
    return `com.googleusercontent.apps.${clientId.slice(0, -clientIdSuffix.length)}`;
  });

  const existingSchemes = Array.isArray(config.scheme)
    ? config.scheme
    : config.scheme
      ? [config.scheme]
      : [];

  return {
    ...config,
    scheme: [...new Set([...existingSchemes, ...googleSchemes])],
  };
};
