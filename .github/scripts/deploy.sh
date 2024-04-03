source ~/.nvm/nvm.sh
export BUN_INSTALL="$HOME/.bun"
export PATH=$BUN_INSTALL/bin:$PATH

nvm use 20

git fetch
git stash
git checkout origin/$1 

bun install --frozen-lockfile
bun prisma generate
bun compile $2

sudo systemctl restart $2

if [[ ! -z $3 ]]  ; then 
    git switch -
fi