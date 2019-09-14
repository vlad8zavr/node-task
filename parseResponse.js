
module.exports = {

    parseCommitList: function(out) {
        arrayOfCommits = [];
        out.split('\n').forEach(item => {
            let hash = item.split('<><><>')[0].trim();
            let date = item.split('<><><>')[1].split('|||')[0].trim();
            let commit = item.split('|||')[1].trim();
            arrayOfCommits.push({ hash: hash, commit: commit, date: date });
        });
        return arrayOfCommits;
    },

    getPathFromUrl: function(req, repositoryId, commitHash, variant) {
        const urlpath = req.originalUrl.replace(req.baseUrl, "");
        const startLine = (commitHash) ? `/api/repos/${repositoryId}/${variant}/${commitHash}/` : `/api/repos/${repositoryId}/${variant}/`;
        const filepath = urlpath.replace(startLine, '');

        console.log('<><><>');
        console.log(urlpath);
        console.log(startLine);
        console.log(filepath);
        console.log('------------------------------');

        // if (urlpath.slice(-1) === '/') return filepath;
        return filepath;
    }

}
