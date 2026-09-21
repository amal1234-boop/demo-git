/*
 * Exercice 3 - Utilisation de calloc() et comparaison
 *
 * Modifie l'exercice 2 pour :
 * - Utiliser calloc() a la place de malloc()
 * - Afficher le contenu du tableau juste apres l'allocation (avant saisie)
 * - Comparer le comportement avec celui de malloc() (valeurs initiales)
 *
 * Difference observee :
 * - malloc(n, sizeof(int)) ne met pas la memoire a zero : le tableau
 *   contient des valeurs indeterminees ("garbage values") heritees de
 *   la memoire non initialisee.
 * - calloc(n, sizeof(int)) initialise en revanche tous les octets a 0,
 *   donc chaque case du tableau vaut 0 juste apres l'allocation.
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

    tableau = (int *) calloc(n, sizeof(int));

    if (tableau == NULL)
    {
        printf("Erreur : l'allocation memoire a echoue.\n");
        return 1;
    }

    printf("Allocation (calloc) reussie pour %d entiers.\n", n);

    printf("\nContenu du tableau juste apres l'allocation (avant saisie) :\n");
    for (i = 0; i < n; i++)
    {
        printf("tableau[%d] = %d\n", i, tableau[i]);
    }
    printf("-> Avec calloc(), toutes les cases sont initialisees a 0,\n");
    printf("   alors qu'avec malloc() elles contiendraient des valeurs\n");
    printf("   indeterminees (non initialisees).\n\n");

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
