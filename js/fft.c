#include <stdio.h>
#include <stdlib.h>
#include <complex.h>
#include <string.h>
#include <math.h>

typedef complex double cx;

double _Complex __muldc3(double, double, double, double);
double cmag(cx z);

void gen_blackman(double, int, double*);
void gen_hann(double, int, double*);
void cwindow(int, char*);

char* cdft(int, char*);
cx A(int, char*, char*);
int b2i(char*, int);
int b2ijk(char*, char*, int);

double* g_window;
int main(int argc, char const *argv[]) {
    return 0;
}

_Bool window_done = 0;
int m, l;
cx W;
cx* X;
char* cdft(int N, char* x) {
    if (!window_done) {
        g_window = (double*)malloc(N * sizeof(double));
        gen_blackman(0.16, N, g_window);
        window_done = 1;
    }
    X = (cx*)malloc(N * sizeof(cx)); // shared memory for every stage of recursion
    for (int i = 0; i < N; i++) {
        X[i] = (cx)x[i];
    } // put x into X

    cwindow(N, x);

    m = (int)log2(N);
    W = cexp(2*M_PI/N*I);
    char* j = (char*)malloc(m * sizeof(char));
    char* k = (char*)malloc(m * sizeof(char));

    cx X = A(m, j, k);
    printf("Recursion done: %f + %fi\n", creal(X), cimag(X));

    char* ret = (char*)malloc(N * sizeof(char));

    return ret;
}

// little-endian
int b2i(char* bits, int n) {
    int index = 0;

    for (int i = n-1; i > -1; i--)
        index += bits[i]<<i;

    return index;
}

int b2ijk(char* jbits, char* kbits, int l) {
    int index = 0;

    int pos = m - 1;
    int v;
    // j traversed 0 - l-1
    for (v = 0; v < l; v++) {
        index += jbits[v]<<pos;
        pos--;
    } // k traversed m-l-1 - 0
    for (v = m-l-1; v > -1; v--) {
        index += kbits[v]<<pos;
        pos--;
    }

    return index;
}

cx A(int l, char* j, char* k) {
    if (l < 2) {
        // we've reached A_1, which uses A (the time domain signal)
        // should return the sum of
            // first half of A + second half of A
            // and
            // first half of A - second half of A
        // (because the sum is over k_m-1, the MSB of k)
        return 1;
    }

    W = cpow(W, b2i(j, l)*k[m-l]<<(m-l));

    // the key: X[b2ijk(j, k, l)]
    // b2ijk() returns the index of the element of X that we're calculating now
    // in the paper, each j_v represents [0, 1] so that iterating through all of them iterates through 

    return A(l-1, j, k) + W*A(l-1, j, k);
}

void gen_blackman(double a, int N, double* blackman) {
    N++;
    
    double a0 = (1-a)/2.0;
    double a1 = 0.5;
    double a2 = a/2;

    for (int n = 0; n < N; n++) {
        blackman[n] = a0 - a1*cos(2*M_PI*n/(N - 1.0)) + a2*cos(4*M_PI*n/(N - 1.0));
    }
}

void gen_hann(double a, int N, double* hann) {
    N++;

    for (int n = 0; n < N; n++) {
        hann[n] = 0.5*(1 - cos(2*M_PI*n/(N - 1.0)));
    }
}

// in-place windowing
void cwindow(int N, char* x) {
    for (int n = 0; n < N; n++) {
        x[n] = (char)(x[n]*g_window[n]);
    }
}

double cmag(cx z) {
    return sqrt(creal(z)*creal(z) + cimag(z)*cimag(z));
}

// http://opensource.apple.com/source/clang/clang-137/src/projects/compiler-rt/lib/muldc3.c
double _Complex
__muldc3(double __a, double __b, double __c, double __d)
{
    double __ac = __a * __c;
    double __bd = __b * __d;
    double __ad = __a * __d;
    double __bc = __b * __c;
    double _Complex z;
    __real__ z = __ac - __bd;
    __imag__ z = __ad + __bc;
    if (isnan(__real__ z) && isnan(__imag__ z))
    {
        int __recalc = 0;
        if (isinf(__a) || isinf(__b))
        {
            __a = copysign(isinf(__a) ? 1 : 0, __a);
            __b = copysign(isinf(__b) ? 1 : 0, __b);
            if (isnan(__c))
                __c = copysign(0, __c);
            if (isnan(__d))
                __d = copysign(0, __d);
            __recalc = 1;
        }
        if (isinf(__c) || isinf(__d))
        {
            __c = copysign(isinf(__c) ? 1 : 0, __c);
            __d = copysign(isinf(__d) ? 1 : 0, __d);
            if (isnan(__a))
                __a = copysign(0, __a);
            if (isnan(__b))
                __b = copysign(0, __b);
            __recalc = 1;
        }
        if (!__recalc && (isinf(__ac) || isinf(__bd) ||
                          isinf(__ad) || isinf(__bc)))
        {
            if (isnan(__a))
                __a = copysign(0, __a);
            if (isnan(__b))
                __b = copysign(0, __b);
            if (isnan(__c))
                __c = copysign(0, __c);
            if (isnan(__d))
                __d = copysign(0, __d);
            __recalc = 1;
        }
        if (__recalc)
        {
            __real__ z = INFINITY * (__a * __c - __b * __d);
            __imag__ z = INFINITY * (__a * __d + __b * __c);
        }
    }
    return z;
}