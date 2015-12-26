#include <stdio.h>
#include <stdlib.h>
#include <complex.h>
#include <math.h>

typedef complex double cx;

// http://opensource.apple.com/source/clang/clang-137/src/projects/compiler-rt/lib/muldc3.c
double _Complex
__muldc3(double __a, double __b, double __c, double __d);
double cmag(cx z);

void gen_blackman(double, int, double*);
void gen_hann(double, int, double*);
void cwindow(int, char*);

char* cdft(int, char*);
void A(int, int, int, int, char*, char*);

double* g_window;
int main(int argc, char const *argv[]) {
    return 0;
}

_Bool window_done = 0;
char* cdft(int N, char* x) {
    if (!window_done) {
        g_window = (double*)malloc(N * sizeof(double));
        gen_blackman(0.16, N, g_window);
        window_done = 1;
    }
    char* X = (char*)malloc(N * sizeof(char));

    cwindow(N, x);

    // for (int j = 0; j < N; j++) {
    //     for (int k = 0; k < N; k++) {
    //         Xj += x[k]*cexp(-I*2*M_PI*j*k/(N*1.0));
    //     }
    //     X[j] = (char)(cmag(Xj)/N);
    //     Xk = 0;
    // }

    int m = (int)log2(N);
    X = A(N, m, N-1, x, X);

    return X;
}


cx W, twid;
void A(int N, int m, int l, int k, char* x, char* X) {
    W = cexp(2*I*M_PI/N);
    int exponent = 0;

    for (int j = 0; j < l; j++) {
        exponent += j*(int)pow(2, j);
    }
    exponent *= (int)pow(2, m-l);
    twid = cpow(W, exponent);

    if (l < 2)
        return x[k]; // base case (?)

    X = A(N/2, m, l-1, k, x, X) + twid*A(N/2, m, l-1, k, x, X);

    cx Xk = 0;
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