# Mini-projet RO : notes pour le rapport

Compilation : `gcc -Wall -Wextra -std=c99 -o campagne campagne.c` (aucun avertissement).
Exécution : `./campagne` (6 h), `./campagne 4`, `./campagne 7`, `./campagne 6 publications.txt`.
Valgrind : « All heap blocks were freed -- no leaks are possible ».

## Partie 1 : Modélisation

1. **Variables de décision** : x₁ … x₆ ∈ {0, 1}, avec xᵢ = 1 si la publication i est produite.
   Il y en a 6 (Vidéo courte, Meme, Story, Interview, Sondage, Tutoriel).
2. **Fonction objectif** : maximiser Z = 80x₁ + 35x₂ + 25x₃ + 100x₄ + 30x₅ + 70x₆
3. **Contrainte de temps** : 2x₁ + x₂ + x₃ + 3x₄ + x₅ + 2x₆ ≤ 6
4. 2⁶ = **64** sélections possibles, dont **47** réalisables (27 avec 4 h, 55 avec 7 h).
5. Exemple de sélection faite à la main : Vidéo + Interview + Sondage, soit 6 h pour 210. Elle n'est pas optimale (voir la Partie 5).

## Partie 3

Vidéo courte + Interview + Sondage : 6 h, engagement 210, réalisable.

## Partie 4 : Gloutons (6 h)

| Méthode | Publications retenues | Temps | Engagement |
|---|---|---|---|
| Glouton A (engagement) | Interview, Vidéo courte, Meme | 6 h | **215** |
| Glouton B (temps) | Meme, Story, Sondage, Vidéo courte | 5 h | 170 |
| Glouton C (ratio) | Vidéo courte, Meme, Tutoriel, Sondage | 6 h | **215** |

Ratios : Vidéo 40 ; Meme 35 ; Tutoriel 35 ; Interview 33,33 ; Sondage 30 ; Story 25.
En cas d'égalité, le tri à bulles (stable) garde l'ordre de l'énoncé.

## Partie 5 : Exploration exhaustive

1. Le compteur indique **64** feuilles examinées (2⁶).
2. L'engagement maximal est **215**. **Deux** sélections l'atteignent, donc l'optimum n'est pas unique :
   - Vidéo courte + Meme + Interview (6 h)
   - Vidéo courte + Meme + Sondage + Tutoriel (6 h)
3. Les deux paramètres sont passés par adresse pour trois raisons :
   - `meilleure` doit être **modifiée** par les appels récursifs, et le résultat doit remonter jusqu'à `main`. Une copie passée par valeur serait perdue au retour de la fonction.
   - Une seule `courante` est partagée : on la modifie (on prend la publication i) puis on annule le choix (backtracking).
   - On évite de copier toute la structure (le tableau de 20 int) à chacun des 127 appels.

## Partie 6 : Analyse

| Capacité | Optimum (exhaustif / prog. dyn.) | Glouton A | Glouton B | Glouton C |
|---|---|---|---|---|
| 4 h | 150 (Vidéo + Tutoriel) | 135 | 90 | 145 |
| 6 h | 215 (2 solutions) | **215** | 170 | **215** |
| 7 h | 250 (Vidéo + Interview + Tutoriel) | **250** | 240 | 240 |

1. À 6 h, les gloutons A et C trouvent l'optimum, mais pas le glouton B.
2. À 4 h, **aucun** glouton ne trouve l'optimum. À 7 h, seul A le trouve, alors que C (le « meilleur » critère en théorie) échoue.
   Conclusion : une heuristique gloutonne est rapide (tri en O(n²) ou O(n log n), puis un seul parcours), mais elle ne garantit pas l'optimum. Le meilleur critère change selon les données. En effet, le glouton ne revient jamais sur un choix et peut laisser du temps inutilisé, ou le remplir mal.
3. Avec 60 publications, l'exploration exhaustive demande 2⁶⁰ ≈ 1,15 × 10¹⁸ feuilles, ce qui est impossible en pratique. Deux méthodes conviennent :
   - la **programmation dynamique** (bonus implémenté), qui est exacte, en O(n × T) : 60 × 7 cases seulement, car les temps sont entiers et petits ;
   - à défaut, un glouton par ratio, éventuellement amélioré par une recherche locale.

## Pistes pour la conclusion

L'engagement est **estimé** : le modèle est déterministe alors que la réalité est incertaine. Le modèle ignore aussi :
- les effets de synergie ou de saturation entre publications ;
- les heures de publication ;
- le fait que les publications soient au plus une par type.

Ouvertures possibles :
- plusieurs contraintes (budget et temps) : sac à dos multidimensionnel ;
- plusieurs jours de campagne ;
- l'optimisation stochastique.
