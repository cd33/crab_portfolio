Je veux créer une intro Three.js inspirée de Bruno Simon pour mon portfolio.

CONTEXTE :

- Ma scène principale contient un crabe 3D
- Je veux une intro impressionnante avant d'accéder à la scène

SPÉCIFICATIONS TECHNIQUES :

1. ÉCRAN D'ACCUEIL (Intro) :
   - Fond noir avec effet de profondeur (fog)
   - Crabe 3D au centre, mis en valeur avec un éclairage dramatique (SpotLight + AmbientLight)
   - Le crabe doit tourner lentement sur lui-même (rotation Y animée)
   - Particules flottantes autour du crabe (géométrie BufferGeometry avec Points)
   - Texte overlay "Cliquez sur le crabe pour entrer" avec animation de pulsation
   - Effet de glow/bloom sur le crabe si possible

2. INTERACTION :
   - Détection du clic sur le crabe (Raycaster)
   - Au clic : animation de transition spectaculaire
   - Transition suggestions :
     - Zoom rapide vers le crabe + fade to white
     - Explosion de particules
     - Camera qui traverse le crabe comme un portail

3. TRANSITION VERS LA SCÈNE PRINCIPALE :
   - Après l'animation, charger/afficher ma scène principale
   - Transition fluide de 1-2 secondes

4. CODE STRUCTURE :
   - Utiliser Three.js (import depuis CDN)
   - Responsive design
   - Performance optimisée (60 FPS)

5. STYLE VISUEL :
   - Inspiré de bruno-simon.com
   - Ambiance spatiale/onirique
   - Couleurs : bleus profonds, violets, touches de cyan
   - Effet de profondeur important

Crée-moi le code complet avec des commentaires pour que je puisse l'adapter facilement.
