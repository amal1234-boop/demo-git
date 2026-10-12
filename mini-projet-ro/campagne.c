/*
 * campagne.c
 * Mini-projet C - Recherche opérationnelle et réseaux sociaux (B2 ESGI)
 *
 * Problème : une agence dispose de T heures pour préparer des publications.
 * Chaque publication a un temps de préparation et un engagement estimé.
 * On veut choisir les publications (chacune au plus une fois) qui
 * maximisent l'engagement total sans dépasser T heures.
 * C'est un problème de sac à dos 0/1.
 *
 * Méthodes implémentées :
 *   - évaluation d'une sélection donnée (Partie 3) ;
 *   - trois heuristiques gloutonnes avec un tableau de pointeurs (Partie 4) ;
 *   - exploration exhaustive récursive (Partie 5) ;
 *   - bonus : affichage de toutes les solutions optimales, capacité passée
 *     en argument, lecture des publications dans un fichier texte,
 *     programmation dynamique.
 *
 * Compilation : gcc -Wall -Wextra -std=c99 -o campagne campagne.c
 * Utilisation : ./campagne                  (capacité 6 h, données de l'énoncé)
 *               ./campagne 4                (capacité 4 h)
 *               ./campagne 7 pubs.txt       (capacité 7 h, données du fichier)
 *
 * Format du fichier : une publication par ligne : nom temps engagement
 * (le nom ne contient pas d'espace, par exemple Video_courte 2 80).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PUBS 20      /* nombre maximal de publications */
#define TAILLE_NOM 32    /* taille maximale d'un nom (avec le '\0') */

/* ------------------------------------------------------------------ */
/* Structures                                                          */
/* ------------------------------------------------------------------ */

/* Une publication possible. */
typedef struct {
    char nom[TAILLE_NOM];
    int temps;          /* temps de préparation en heures */
    int engagement;     /* engagement estimé */
    double ratio;       /* engagement par heure */
} Publication;

/* Les données du problème. */
typedef struct {
    Publication *pubs;  /* tableau alloué dynamiquement */
    int nb;             /* nombre de publications réellement ajoutées */
    int capacite;       /* temps disponible en heures */
} Probleme;

/* Une sélection de publications. */
typedef struct {
    int choisi[MAX_PUBS];   /* choisi[i] vaut 1 si la publication i est prise */
    int temps_total;
    int engagement_total;
} Solution;

/* ------------------------------------------------------------------ */
/* Partie 2 - Gestion du problème                                      */
/* ------------------------------------------------------------------ */

/* Alloue un problème vide de capacité donnée (en heures).
 * Renvoie NULL si une allocation échoue. */
Probleme *creer_probleme(int capacite)
{
    Probleme *p = malloc(sizeof(Probleme));
    if (p == NULL) {
        return NULL;
    }

    p->pubs = malloc(MAX_PUBS * sizeof(Publication));
    if (p->pubs == NULL) {
        free(p);    /* on libère ce qui a déjà été alloué */
        return NULL;
    }

    p->nb = 0;
    p->capacite = capacite;
    return p;
}

/* Libère le tableau de publications puis le problème lui-même. */
void liberer_probleme(Probleme *p)
{
    if (p == NULL) {
        return;
    }
    free(p->pubs);
    free(p);
}

/* Ajoute une publication à la fin du tableau (si il reste de la place). */
void ajouter_publication(Probleme *p, const char *nom, int temps, int engagement)
{
    Publication *pub;

    if (p->nb >= MAX_PUBS) {
        printf("Impossible d'ajouter %s : tableau plein.\n", nom);
        return;
    }

    pub = &p->pubs[p->nb];  /* pointeur vers la case libre */
    strncpy(pub->nom, nom, TAILLE_NOM - 1);
    pub->nom[TAILLE_NOM - 1] = '\0';
    pub->temps = temps;
    pub->engagement = engagement;
    pub->ratio = 0.0;
    p->nb++;
}

/* Calcule le ratio engagement / heure de chaque publication.
 * Attention : on convertit en double, sinon 100 / 3 donnerait 33. */
void calculer_ratios(Probleme *p)
{
    int i;
    for (i = 0; i < p->nb; i++) {
        if (p->pubs[i].temps > 0) {
            p->pubs[i].ratio = (double)p->pubs[i].engagement / p->pubs[i].temps;
        } else {
            p->pubs[i].ratio = 0.0;
        }
    }
}

/* Affiche toutes les publications sous forme de tableau. */
void afficher_publications(const Probleme *p)
{
    int i;
    printf("\n  #  %-16s %6s %11s %10s\n", "Publication", "Temps", "Engagement", "Ratio");
    printf("  -----------------------------------------------\n");
    for (i = 0; i < p->nb; i++) {
        printf("  %d  %-16s %5dh %11d %10.2f\n", i, p->pubs[i].nom,
               p->pubs[i].temps, p->pubs[i].engagement, p->pubs[i].ratio);
    }
    printf("  Temps disponible : %d h\n", p->capacite);
}

/* Charge les publications de l'énoncé. */
void charger_donnees_enonce(Probleme *p)
{
    ajouter_publication(p, "Video courte", 2, 80);
    ajouter_publication(p, "Meme", 1, 35);
    ajouter_publication(p, "Story", 1, 25);
    ajouter_publication(p, "Interview", 3, 100);
    ajouter_publication(p, "Sondage", 1, 30);
    ajouter_publication(p, "Tutoriel", 2, 70);
}

/* Bonus : lit les publications depuis un fichier texte.
 * Chaque ligne : nom temps engagement. Renvoie 1 si tout va bien, 0 sinon. */
int charger_fichier(Probleme *p, const char *chemin)
{
    FILE *f;
    char nom[TAILLE_NOM];
    int temps, engagement;

    f = fopen(chemin, "r");
    if (f == NULL) {
        printf("Impossible d'ouvrir le fichier %s\n", chemin);
        return 0;
    }

    /* %31s : on ne lit jamais plus de 31 caractères pour ne pas déborder */
    while (fscanf(f, "%31s %d %d", nom, &temps, &engagement) == 3) {
        ajouter_publication(p, nom, temps, engagement);
    }

    fclose(f);
    return p->nb > 0;
}

/* ------------------------------------------------------------------ */
/* Partie 3 - Évaluer une sélection                                    */
/* ------------------------------------------------------------------ */

/* Met à zéro tous les champs d'une solution. */
void initialiser_solution(Solution *s)
{
    int i;
    for (i = 0; i < MAX_PUBS; i++) {
        s->choisi[i] = 0;
    }
    s->temps_total = 0;
    s->engagement_total = 0;
}

/* Recalcule le temps total et l'engagement total à partir de s->choisi. */
void evaluer_solution(const Probleme *p, Solution *s)
{
    int i;
    s->temps_total = 0;
    s->engagement_total = 0;
    for (i = 0; i < p->nb; i++) {
        if (s->choisi[i] == 1) {
            s->temps_total += p->pubs[i].temps;
            s->engagement_total += p->pubs[i].engagement;
        }
    }
}

/* Renvoie 1 si la contrainte de temps est respectée, 0 sinon. */
int est_realisable(const Probleme *p, const Solution *s)
{
    return s->temps_total <= p->capacite;
}

/* Affiche les publications choisies, le temps et l'engagement. */
void afficher_solution(const Probleme *p, const Solution *s, const char *titre)
{
    int i;
    int premier = 1;

    printf("\n%s\n", titre);
    printf("  Publications : ");
    for (i = 0; i < p->nb; i++) {
        if (s->choisi[i] == 1) {
            if (!premier) {
                printf(" + ");
            }
            printf("%s", p->pubs[i].nom);
            premier = 0;
        }
    }
    if (premier) {
        printf("(aucune)");
    }
    printf("\n  Temps : %d h / %d h   Engagement : %d   %s\n",
           s->temps_total, p->capacite, s->engagement_total,
           est_realisable(p, s) ? "REALISABLE" : "NON REALISABLE");
}

/* Demande à l'utilisateur 0 ou 1 pour chaque publication.
 * Renvoie 1 si la saisie est complète, 0 sinon (fin d'entrée, erreur...). */
int saisir_solution(const Probleme *p, Solution *s)
{
    int i, valeur;

    initialiser_solution(s);
    printf("\nSaisissez votre selection (1 = prise, 0 = non prise) :\n");
    for (i = 0; i < p->nb; i++) {
        do {
            printf("  %s ? ", p->pubs[i].nom);
            if (scanf("%d", &valeur) != 1) {
                printf("\nSaisie interrompue.\n");
                return 0;
            }
        } while (valeur != 0 && valeur != 1);
        s->choisi[i] = valeur;
    }
    evaluer_solution(p, s);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Partie 4 - Heuristiques gloutonnes                                  */
/* ------------------------------------------------------------------ */

#define CRITERE_ENGAGEMENT 0   /* A : engagement décroissant */
#define CRITERE_TEMPS      1   /* B : temps croissant */
#define CRITERE_RATIO      2   /* C : ratio engagement/heure décroissant */

/* Renvoie 1 si la publication a doit passer strictement avant b
 * selon le critère choisi. */
int passe_avant(const Publication *a, const Publication *b, int critere)
{
    if (critere == CRITERE_ENGAGEMENT) {
        return a->engagement > b->engagement;
    }
    if (critere == CRITERE_TEMPS) {
        return a->temps < b->temps;
    }
    return a->ratio > b->ratio;
}

/* Remplit ordre[] avec des pointeurs vers les publications puis trie
 * ce tableau de pointeurs (tri à bulles). p->pubs n'est jamais modifié :
 * seuls les pointeurs sont échangés. Le tri à bulles est stable :
 * en cas d'égalité, l'ordre de l'énoncé est conservé. */
void trier_pointeurs(Probleme *p, Publication *ordre[], int critere)
{
    int i, j;
    Publication *tmp;

    for (i = 0; i < p->nb; i++) {
        ordre[i] = &p->pubs[i];
    }

    for (i = 0; i < p->nb - 1; i++) {
        for (j = 0; j < p->nb - 1 - i; j++) {
            if (passe_avant(ordre[j + 1], ordre[j], critere)) {
                tmp = ordre[j];
                ordre[j] = ordre[j + 1];
                ordre[j + 1] = tmp;
            }
        }
    }
}

/* Méthode gloutonne : on parcourt les publications dans l'ordre du critère
 * et on prend chacune si elle rentre dans le temps restant. */
void glouton(Probleme *p, int critere, Solution *s)
{
    Publication *ordre[MAX_PUBS];
    int k, indice;
    int temps_restant = p->capacite;

    trier_pointeurs(p, ordre, critere);
    initialiser_solution(s);

    for (k = 0; k < p->nb; k++) {
        if (ordre[k]->temps <= temps_restant) {
            /* arithmétique de pointeurs : position dans p->pubs */
            indice = (int)(ordre[k] - p->pubs);
            s->choisi[indice] = 1;
            temps_restant -= ordre[k]->temps;
        }
    }

    evaluer_solution(p, s);
}

/* ------------------------------------------------------------------ */
/* Partie 5 - Exploration exhaustive                                   */
/* ------------------------------------------------------------------ */

/* Parcourt récursivement l'arbre de décision.
 * i : publication sur laquelle on décide.
 * courante : sélection en cours de construction (modifiée puis restaurée).
 * meilleure : meilleure sélection réalisable trouvée jusqu'ici.
 * nb_feuilles : compteur des sélections complètes examinées
 *               (passé par adresse car il n'y a pas de variable globale). */
void explorer(const Probleme *p, int i, Solution *courante, Solution *meilleure,
              long *nb_feuilles)
{
    if (i == p->nb) {
        /* feuille : la sélection est complète */
        (*nb_feuilles)++;
        evaluer_solution(p, courante);
        if (est_realisable(p, courante)
            && courante->engagement_total > meilleure->engagement_total) {
            *meilleure = *courante;   /* copie de toute la structure */
        }
        return;
    }

    /* branche 1 : on prend la publication i */
    courante->choisi[i] = 1;
    explorer(p, i + 1, courante, meilleure, nb_feuilles);

    /* branche 2 : on annule ce choix et on ne la prend pas */
    courante->choisi[i] = 0;
    explorer(p, i + 1, courante, meilleure, nb_feuilles);
}

/* Bonus : même parcours, mais affiche toutes les sélections réalisables
 * dont l'engagement vaut l'optimum. Renvoie le nombre trouvé. */
int afficher_optimales(const Probleme *p, int i, Solution *courante, int optimum)
{
    int nb = 0;

    if (i == p->nb) {
        evaluer_solution(p, courante);
        if (est_realisable(p, courante) && courante->engagement_total == optimum) {
            afficher_solution(p, courante, "Solution optimale :");
            return 1;
        }
        return 0;
    }

    courante->choisi[i] = 1;
    nb += afficher_optimales(p, i + 1, courante, optimum);
    courante->choisi[i] = 0;
    nb += afficher_optimales(p, i + 1, courante, optimum);
    return nb;
}

/* ------------------------------------------------------------------ */
/* Bonus - Programmation dynamique                                     */
/* ------------------------------------------------------------------ */

/* meilleur[i][t] = meilleur engagement en utilisant les i premières
 * publications avec au plus t heures. Le tableau 2D est stocké dans un
 * seul bloc alloué : la case [i][t] est à l'indice i * (capacite + 1) + t.
 * Renvoie 1 si tout va bien, 0 si l'allocation échoue. */
int programmation_dynamique(const Probleme *p, Solution *s)
{
    int largeur = p->capacite + 1;
    int i, t, avec;
    int *meilleur;

    meilleur = malloc((p->nb + 1) * largeur * sizeof(int));
    if (meilleur == NULL) {
        return 0;
    }

    /* avec 0 publication, l'engagement est nul */
    for (t = 0; t < largeur; t++) {
        meilleur[t] = 0;
    }

    for (i = 1; i <= p->nb; i++) {
        const Publication *pub = &p->pubs[i - 1];
        for (t = 0; t < largeur; t++) {
            /* sans la publication i-1 */
            meilleur[i * largeur + t] = meilleur[(i - 1) * largeur + t];
            /* avec la publication i-1, si elle rentre */
            if (pub->temps <= t) {
                avec = meilleur[(i - 1) * largeur + t - pub->temps] + pub->engagement;
                if (avec > meilleur[i * largeur + t]) {
                    meilleur[i * largeur + t] = avec;
                }
            }
        }
    }

    /* on remonte le tableau pour retrouver les publications choisies */
    initialiser_solution(s);
    t = p->capacite;
    for (i = p->nb; i >= 1; i--) {
        if (meilleur[i * largeur + t] != meilleur[(i - 1) * largeur + t]) {
            s->choisi[i - 1] = 1;
            t -= p->pubs[i - 1].temps;
        }
    }
    evaluer_solution(p, s);

    free(meilleur);
    return 1;
}

/* ------------------------------------------------------------------ */
/* Programme principal                                                 */
/* ------------------------------------------------------------------ */

int main(int argc, char *argv[])
{
    Probleme *p;
    Solution s, courante, meilleure, dyn;
    Solution gloutons[3];
    const char *noms_criteres[3] = {
        "Glouton A (engagement decroissant)",
        "Glouton B (temps croissant)",
        "Glouton C (ratio decroissant)"
    };
    int capacite = 6;
    int c, nb_optimales;
    long nb_feuilles = 0;

    /* Bonus : capacité passée en argument */
    if (argc >= 2) {
        capacite = atoi(argv[1]);
        if (capacite < 0) {
            printf("Capacite invalide : %s\n", argv[1]);
            return 1;
        }
    }

    p = creer_probleme(capacite);
    if (p == NULL) {
        printf("Erreur : allocation memoire impossible.\n");
        return 1;
    }

    /* Bonus : publications lues dans un fichier si un 2e argument est donné */
    if (argc >= 3) {
        if (!charger_fichier(p, argv[2])) {
            liberer_probleme(p);
            return 1;
        }
    } else {
        charger_donnees_enonce(p);
    }

    calculer_ratios(p);

    printf("=== Campagne de publications : %d heures disponibles ===\n", p->capacite);
    afficher_publications(p);

    /* ---- Partie 3 : évaluation d'une sélection ---- */
    printf("\n--- Partie 3 : evaluation d'une selection ---\n");
    if (argc < 3) {
        /* Vidéo courte (0) + Interview (3) + Sondage (4) */
        initialiser_solution(&s);
        s.choisi[0] = 1;
        s.choisi[3] = 1;
        s.choisi[4] = 1;
        evaluer_solution(p, &s);
        afficher_solution(p, &s, "Selection Video courte + Interview + Sondage :");
    }

    if (saisir_solution(p, &s)) {
        afficher_solution(p, &s, "Votre selection :");
    }

    /* ---- Partie 4 : heuristiques gloutonnes ---- */
    printf("\n--- Partie 4 : heuristiques gloutonnes ---\n");
    for (c = 0; c < 3; c++) {
        glouton(p, c, &gloutons[c]);
        afficher_solution(p, &gloutons[c], noms_criteres[c]);
    }

    /* ---- Partie 5 : exploration exhaustive ---- */
    printf("\n--- Partie 5 : exploration exhaustive ---\n");
    initialiser_solution(&courante);
    initialiser_solution(&meilleure);
    explorer(p, 0, &courante, &meilleure, &nb_feuilles);
    printf("\nSelections completes examinees : %ld (2^%d)\n", nb_feuilles, p->nb);
    afficher_solution(p, &meilleure, "Meilleure solution trouvee :");

    /* Bonus : toutes les solutions optimales */
    printf("\nToutes les solutions d'engagement %d :\n", meilleure.engagement_total);
    initialiser_solution(&courante);
    nb_optimales = afficher_optimales(p, 0, &courante, meilleure.engagement_total);
    printf("\n=> %d solution(s) optimale(s)%s\n", nb_optimales,
           nb_optimales > 1 ? " : l'optimum n'est pas unique." : ".");

    /* Bonus : programmation dynamique */
    printf("\n--- Bonus : programmation dynamique ---\n");
    if (programmation_dynamique(p, &dyn)) {
        afficher_solution(p, &dyn, "Solution par programmation dynamique :");
    } else {
        printf("Erreur : allocation memoire impossible.\n");
    }

    /* ---- Partie 6 : comparaison ---- */
    printf("\n--- Partie 6 : comparaison avec l'optimum (%d) ---\n",
           meilleure.engagement_total);
    for (c = 0; c < 3; c++) {
        printf("  %-36s : %3d  %s\n", noms_criteres[c],
               gloutons[c].engagement_total,
               gloutons[c].engagement_total == meilleure.engagement_total
                   ? "optimal" : "NON optimal");
    }

    liberer_probleme(p);
    return 0;
}
