/* Compatibility facade for the established WordTales module surface. */
WordTales.Features = {
  Navigation: WordTales.Navigation,
  Reader: WordTales.Reader,
  WordPopup: WordTales.WordPopup,
  Progress: WordTales.Progress,
  Game: WordTales.Game,
  CopyPractice: WordTales.CopyPractice,
  Analysis: WordTales.Analysis,
  Cards: WordTales.Cards,
  App: WordTales.App
};

document.addEventListener('DOMContentLoaded', WordTales.App.init);
