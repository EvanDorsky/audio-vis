#include <stdio.h>
#include <stdlib.h>
#include <complex.h>
#include <string.h>
#include <math.h>
#include <limits.h>

#ifndef fft_h
#define fft_h
#endif /* fft_h */

void setN(int N);

char* fft(char* input);
char* dft(char* input);