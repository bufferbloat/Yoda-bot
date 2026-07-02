const path = require("path");

const videoPath = path.join(__dirname, "..", "assets", "kms.mov");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;

    if (message.content.toLowerCase().includes("kill myself")) {
      try {
        await message.channel.send({
          files: [videoPath],
        });
      } catch (error) {
        console.error("Error sending video response:", error);
      }
    }
  },
};
