const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        //callbackURL: 'http://localhost:5001/api/auth/google/callback'
        callbackURL:"https://realtime-notes-ai-mb4-production.up.railway.app/api/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find user by googleId
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Create new user if not found
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value
          });

          user = await newUser.save();
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Serialize user - use _id
  passport.serializeUser((user, done) => {
    done(null, user._id.toString());
  });

  // Deserialize user - find by _id
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};