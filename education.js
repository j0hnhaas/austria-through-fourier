/* Self-contained educational layer. Does not change the Fourier calculation. */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const harmonic = $("harmonics");
  const step = $("learningStep");
  const hint = $("harmonicsHint");
  const start = $("startExperiment");
  const modal = $("helpDialog");
  if (!harmonic || !step || !hint || !modal) return;

  function updateHint() {
    const n = Number(harmonic.value);
    let title, body;
    if (n === 1) {
      title = "Schritt 1 · Die Grundform";
      body = "Eine Schwingung nach links und rechts und eine nach oben und unten erzeugen eine Ellipse (in Sonderfällen eine Linie).";
    } else if (n <= 4) {
      title = "Schritt 2 · Erste Veränderungen";
      body = "Weitere Schwingungen verformen die einfache Kurve. Vergleiche sie einmal mit N = 1.";
    } else if (n <= 12) {
      title = "Schritt 2 · Die Form nimmt Gestalt an";
      body = "Aus mehreren Schwingungen entsteht eine komplexere Form. Welche Teile Österreichs erkennst du bereits?";
    } else if (n <= 35) {
      title = "Schritt 3 · Mehr Details";
      body = "Zusätzliche Schwingungen machen feinere Krümmungen möglich. Vergleiche die weiße Kurve mit der blassen Originalkontur.";
    } else {
      title = "Schritt 4 · Die Feinarbeit";
      body = "Viele Schwingungen nähern die Grenze immer genauer an. Beobachte, wo noch kleine Unterschiede bleiben.";
    }
    step.textContent = title;
    hint.textContent = body;
  }

  // Core app.js has already attached its input/preset listeners.
  harmonic.addEventListener("input", updateHint);
  document.querySelectorAll(".preset").forEach(button =>
    button.addEventListener("click", updateHint)
  );
  updateHint();

  if (start) start.addEventListener("click", () => {
    harmonic.value = "1";
    harmonic.dispatchEvent(new Event("input", { bubbles: true }));
    $("restart").click();
    $("stage").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });

  const glossary = {
    axes: {
      title: "Zwei Bewegungen, ein Zeichenpunkt",
      body: "Eine Bewegung legt fest, wie weit der Stift nach links oder rechts wandert (x). Die zweite bestimmt seine Höhe (y). Beides zusammen ergibt in jedem Moment eine Position.",
      example: "Die rote Kette steuert x(t), die weiße Kette steuert y(t). Ihr Zusammenspiel zeichnet die Form."
    },
    harmonic: {
      title: "Was ist eine Harmonische?",
      body: "Eine Harmonische ist eine Schwingung, deren Frequenz ein ganzzahliges Vielfaches der Grundschwingung ist. Mehr solcher Schwingungen können immer kleinere Details einer Form beschreiben.",
      example: "N = 1 heißt: eine Grundschwingung je Richtung. N = 8 bedeutet acht Schwingungen je Richtung."
    },
    epicycles: {
      title: "Warum drehen sich Kreise?",
      body: "Eine Schwingung lässt sich durch einen rotierenden Zeiger veranschaulichen. Mehrere solcher Zeiger können sich zu einer Kette verbinden. Ihre Spitzen bewegen sich auf komplizierteren Bahnen.",
      example: "Die Kreise zeigen die Länge und Rotation der einzelnen Zeiger. Es sind keine echten Pendel unter Schwerkraft."
    },
    fourier: {
      title: "Was ist eine Fourier-Reihe?",
      body: "Eine Fourier-Reihe setzt einen periodisch wiederkehrenden Verlauf aus Sinus- und Kosinusschwingungen zusammen. So können aus einfachen Schwingungen erstaunlich komplexe Muster entstehen.",
      example: "Hier werden die waagrechte und senkrechte Bewegung getrennt aus Schwingungen zusammengesetzt."
    },
    outline: {
      title: "Was ist die Originalkontur?",
      body: "Das ist die aus Kartendaten abgeleitete, vereinfachte Grenzlinie Österreichs. Sie dient als Vorlage, mit der wir die nachgezeichnete Kurve vergleichen.",
      example: "Du kannst die Referenzlinie ausblenden und wieder einblenden."
    },
    error: {
      title: "Was bedeutet Rekonstruktionsfehler?",
      body: "Wir messen für 1.024 entsprechende Punkte den mittleren quadratischen Abstand zwischen dem Original und der aus Schwingungen erzeugten Form. Die Wurzel daraus wird auf die Diagonale der Grenz-Ausdehnung bezogen und als Prozentwert gezeigt.",
      example: "Ein kleiner Wert bedeutet eine genauere Annäherung. Diese Prozentzahl ist kein Anteil an Grenzkilometern."
    }
  };
  const title = $("helpTitle"), body = $("helpBody"), example = $("helpExample");
  const close = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
  };
  let previousFocus = null;
  function openHelp(key) {
    const entry = glossary[key];
    if (!entry) return;
    previousFocus = document.activeElement;
    title.textContent = entry.title;
    body.textContent = entry.body;
    example.textContent = entry.example;
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    $("closeHelp").focus();
  }
  document.querySelectorAll("[data-help]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      // Explanatory buttons nested inside toggles must not toggle the input.
      event.stopPropagation();
      openHelp(button.dataset.help);
    });
  });
  $("closeHelp").addEventListener("click", close);
  $("helpDone").addEventListener("click", close);
  modal.addEventListener("click", event => {
    if (event.target === modal) close();
  });
  modal.addEventListener("close", () => {
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  });
  modal.addEventListener("keydown", event => {
    if (event.key === "Escape" && typeof modal.close !== "function") close();
  });
})();
