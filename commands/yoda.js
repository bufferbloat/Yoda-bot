module.exports = {
  data: {
    name: 'yoda',
    description: 'Get a random greeting or image from Yoda!',
  },
  async execute(interaction) {
    const responses = [
      "https://tenor.com/view/dog-boxing-gif-9370792726768974298",
      "https://tenor.com/view/carteqi-gif-19760273",
      "https://cdn.discordapp.com/attachments/1048022333786439811/1061814599109836801/chad_yoda.png",
      "https://media.discordapp.net/attachments/915670338149441537/1108791879484579890/yodaSmile.gif",
      "The name's Yoda. Jack Russell x Miniature Pinscher—built like a street legend. 100% muscle, 0% fear. Small frame, big game. Speed of a bullet, reflexes like a ghost. I don't bark—I make statements. Step up, keep up, or get left in the dust. 🐕💀🔥",
      "I'm not small—I'm compact, efficient, and built for dominance.",
      ":sleepy2:",
      "https://cdn.discordapp.com/attachments/1343880975247212624/1343888447961825322/yodacool.gif?ex=67bee926&is=67bd97a6&hm=347b72b4f1399d88ae67982a1b1dc510ea4b451da00f1a92d5a7f9fbd49ab762&"
    ];

    const randomIndex = Math.floor(Math.random() * responses.length);
    const response = responses[randomIndex];

    await interaction.reply(response);
  }
}; 