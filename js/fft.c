#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <complex.h>
#include <string.h>
#include <math.h>

typedef complex double cx;

double _Complex __muldc3(double, double, double, double);
double cmag(cx z);
void cprint(cx z);

void gen_blackman(double, int, double*);
void gen_hann(double, int, double*);
void cwindow(int, char*);

char* cdft(int, char*);
cx* fft(int, cx*);

double* g_window;
int main(int argc, char const *argv[]) {
    clock_t start;
    
    int N = 1024;
    char* input = (char*)malloc(N * sizeof(char));
    for (int i = 0; i < N; i++) {
        input[i] = i;
    }
    char* out;
    
    start = clock();
    int i = 0;
    while (i < 2000) {
        if (clock() - start > CLOCKS_PER_SEC/120) {
            out = cdft(N, input);
            start = clock();
            i++;
            printf("It's happening!\n");
        }
    }
    return 0;
}

_Bool window_done = 0;
cx* e;
cx* o;
cx* X;
char* xmag;// windows data, sets basic constants
char* cdft(int N, char* x) {
    if (!window_done) {
        xmag = (char*)malloc(N * sizeof(char));
        g_window = (double*)malloc(N * sizeof(double));
        gen_blackman(0.16, N, g_window);
        window_done = 1;
    }
    cwindow(N, x);
    
    cx* xcx = (cx*)malloc(N * sizeof(cx));
    for (int i = 0; i < N; i++) {
        xcx[i] = (cx)x[i];
    } // put x into X
    
    e = (cx*)malloc(N/2 * sizeof(cx));
    o = (cx*)malloc(N/2 * sizeof(cx));
    X = (cx*)malloc(N * sizeof(cx));
    
    X = fft(N, xcx);
    
    // printf("Output\n");
    for (int i = 0; i < N; i++) {
        // cprint(X[i]);
        xmag[i] = (char)cmag(X[i]);
    } // get X mag from X
    
    free(X);
    free(e);
    free(o);
    free(xcx);
    return xmag;
}

cx W;
cx* fft(int N, cx* x) {
    for (int i = 0; i < N; i+=2) {
        e[i/2] = x[i];
        o[i/2] = x[i+1];
    }
    
    cx* E;
    cx* O;
    if (N > 2) {
        E = fft(N/2, e);
        O = fft(N/2, o);
    } else {
        E = e;
        O = o;
    }
    
    for (int j = 0; j < N/2; j++) {
        W = cexp(2*M_PI/N*I*j);
        X[ 2*j ] = E[j] + O[j]*W;
        X[2*j+1] = E[j] - O[j]*W;
    }
    
    return X;
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

void cprint(cx z) {
    printf("%f + %fi\n", creal(z), cimag(z));
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