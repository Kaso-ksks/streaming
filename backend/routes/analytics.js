const router = require("express").Router();
const admin = require("../middleware/admin");
const Movie = require("../models/Movie");
const User = require("../models/User");

router.use(admin);

router.get("/", async (req, res) => {
  try {
    const [
      moviesCount,
      seriesCount,
      animeCount,
      usersCount,
      premiumUsers,
      adminUsers,
      featuredCount
    ] = await Promise.all([
      Movie.countDocuments({ type: "movie" }),
      Movie.countDocuments({ type: "series" }),
      Movie.countDocuments({ type: "anime" }),
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ isAdmin: true }),
      Movie.countDocuments({ featured: true })
    ]);

    const users = await User.find().select("favorites profiles createdAt");

    const totalFavorites = users.reduce((total, user) => {
      const oldFavorites = user.favorites?.length || 0;

      const profileFavorites =
        user.profiles?.reduce(
          (sum, profile) => sum + (profile.favorites?.length || 0),
          0
        ) || 0;

      return total + oldFavorites + profileFavorites;
    }, 0);

    const totalProfiles = users.reduce(
      (total, user) => total + (user.profiles?.length || 0),
      0
    );

    res.json({
      moviesCount,
      seriesCount,
      animeCount,
      usersCount,
      premiumUsers,
      adminUsers,
      featuredCount,
      totalFavorites,
      totalProfiles,
      totalContent: moviesCount + seriesCount + animeCount
    });
  } catch (err) {
    console.log("Erro analytics:", err);

    res.status(500).json({
      message: "Erro ao carregar analytics"
    });
  }
});

module.exports = router;