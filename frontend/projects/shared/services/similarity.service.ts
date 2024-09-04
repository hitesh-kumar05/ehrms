import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SimilarityService {

  // Levenshtein Distance Calculation
  levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize the matrix
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a.charAt(i - 1) === b.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[a.length][b.length];
  }

  // Longest Common Substring Calculation
  longestCommonSubstring(a: string, b: string): number {
    const matrix: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
    let maxLength = 0;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
          maxLength = Math.max(maxLength, matrix[i][j]);
        }
      }
    }

    return maxLength;
  }

  // Similarity Percentage Calculation
  similarityPercentage(a: string, b: string): number {
    // Remove spaces from both strings
    const aNoSpaces = a.replace(/\s+/g, '');
    const bNoSpaces = b.replace(/\s+/g, '');

    const lcsLength = this.longestCommonSubstring(aNoSpaces, bNoSpaces);
    const maxLength = Math.max(aNoSpaces.length, bNoSpaces.length);

    // Adjust the contribution of LCS to the similarity score
    const lcsScore = (2 * lcsLength) / (aNoSpaces.length + bNoSpaces.length) * 100;

    // Levenshtein distance normalized by the max length of the two strings
    const distance = this.levenshteinDistance(aNoSpaces, bNoSpaces);
    const normalizedDistance = (1 - distance / maxLength) * 100;

    // Calculate the bonus for the presence of string 1 in string 2 (ignoring spaces)
    let presenceBonus = 0;
    if (bNoSpaces.includes(aNoSpaces)) {
      presenceBonus = 60; // Significant bonus for exact match ignoring spaces
    }

    // Combine LCS score, normalized Levenshtein distance, and presence bonus
    const similarity = (lcsScore + normalizedDistance) / 2 + presenceBonus;
    return similarity > 100 ? 100 : similarity;
  }
}
