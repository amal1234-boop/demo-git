/*
 * Exercice 2 - Remplissage du tableau
 *
 * Complete l'exercice 1 pour :
 * - Demander a l'utilisateur de saisir les n valeurs une par une
 * - Stocker chaque valeur dans le tableau
 * - Afficher les valeurs saisies avec leurs indices
 */

#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int n;
    int *tableau;
    int i;

    printf("Combien d'entiers souhaitez-vous stocker ? ");
    scanf("%d", &n);

    tableau = (int *) malloc(n * sizeof(int));

    if (tableau == NULL)
    {
        printf("Erreur : l'allocation memoire a echoue.\n");
        return 1;
    }

    printf("Allocation reussie pour %d entiers.\n", n);

    for (i = 0; i < n; i++)
    {
        printf("Valeur pour l'indice %d : ", i);
        scanf("%d", &tableau[i]);
    }

    printf("\nValeurs saisies :\n");
    for (i = 0; i < n; i++)
    {
        printf("tableau[%d] = %d\n", i, tableau[i]);
    }

    free(tableau);

    return 0;
}
