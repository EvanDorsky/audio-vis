#include <fftw3.h>

int main(int argc, char *argv[]) {
    int N = 1024;

    fftw_complex *in, *out;
    in = (fftw_complex*) fftw_malloc(N * sizeof(fftw_complex));
    out = (fftw_complex*) fftw_malloc(N * sizeof(fftw_complex));

    for (int i = 0; i < N; i++) {
        in[i][0] = i%(1024/8);
        in[i][1] = 0;
    }

    fftw_plan p;

    p = fftw_plan_dft_1d(N, in, out, FFTW_FORWARD, FFTW_ESTIMATE);

    fftw_execute(p);

    fftw_destroy_plan(p);
    fftw_free(in);
    fftw_free(out);
    return 0;
}